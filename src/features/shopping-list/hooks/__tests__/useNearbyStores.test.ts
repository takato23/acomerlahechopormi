import { renderHook, act, waitFor } from '@testing-library/react';
import { useNearbyStores } from '../useNearbyStores';
import type { Store } from '../../services/preciosClarosService';

const mockGetStoresNearby = jest.fn();

jest.mock('../../services/preciosClarosService', () => ({
  preciosClarosService: {
    getStoresNearby: (...args: unknown[]) => mockGetStoresNearby(...args),
  },
}));

describe('useNearbyStores', () => {
  const center = { lat: -34.6037, lng: -58.3816 };

  const buildStore = (overrides: Partial<Store>): Store => ({
    id: 'store-id',
    banderaId: 'bandera',
    comercioId: 'comercio',
    banderaDescripcion: 'Bandera',
    comercioRazonSocial: 'Comercio',
    sucursalNombre: 'Sucursal',
    sucursalTipo: 'Supermercado',
    provincia: 'Buenos Aires',
    localidad: 'CABA',
    direccion: 'Dirección 123',
    lat: center.lat,
    lng: center.lng,
    distanciaNumero: 0,
    distanciaDescripcion: '0 km',
    ...overrides,
  });

  beforeEach(() => {
    mockGetStoresNearby.mockReset();
  });

  it('fetches stores and filters by radius', async () => {
    const stores: Store[] = [
      buildStore({
        id: 'near',
        banderaId: '1',
        comercioId: '1',
        banderaDescripcion: 'Bandera 1',
        comercioRazonSocial: 'Comercio 1',
        sucursalNombre: 'Tienda Cercana',
        lng: center.lng + 0.02,
        distanciaNumero: 1.5,
        distanciaDescripcion: '1.5 km',
      }),
      buildStore({
        id: 'far',
        banderaId: '2',
        comercioId: '2',
        banderaDescripcion: 'Bandera 2',
        comercioRazonSocial: 'Comercio 2',
        sucursalNombre: 'Tienda Lejana',
        provincia: 'Buenos Aires',
        localidad: 'Provincia',
        direccion: 'Calle 2',
        lat: center.lat + 0.3,
        lng: center.lng + 0.3,
        distanciaNumero: 40,
        distanciaDescripcion: '40 km',
      }),
    ];
    mockGetStoresNearby.mockResolvedValue(stores);

    const { result, rerender } = renderHook(({ radius }: { radius: number }) =>
      useNearbyStores(center, radius, { autoFetch: true, limit: 10 })
    , {
      initialProps: { radius: 5 },
    });

    expect(result.current.isLoading).toBe(true);
    await waitForFinish(result);

    expect(mockGetStoresNearby).toHaveBeenCalledTimes(1);
    expect(result.current.stores).toHaveLength(1);
    expect(result.current.stores[0].id).toBe('near');
    expect(result.current.totalFetched).toBe(2);

    rerender({ radius: 50 });

    expect(mockGetStoresNearby).toHaveBeenCalledTimes(1);
    await waitForFinish(result);
    expect(result.current.stores).toHaveLength(2);
  });

  it('refresh refetches stores', async () => {
    mockGetStoresNearby.mockResolvedValue([]);

    const { result } = renderHook(() => useNearbyStores(center, 5, { autoFetch: true }));
    await waitForFinish(result);

    mockGetStoresNearby.mockResolvedValue([
      buildStore({
        id: 'new',
        banderaId: '3',
        comercioId: '3',
        banderaDescripcion: 'Nueva',
        comercioRazonSocial: 'Nueva',
        sucursalNombre: 'Nueva',
        sucursalTipo: 'Mercado',
      }),
    ]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetStoresNearby).toHaveBeenCalledTimes(2);
    expect(result.current.stores).toHaveLength(1);
    expect(result.current.lastFetchedAt).not.toBeNull();
  });
});

async function waitForFinish(result: { current: ReturnType<typeof useNearbyStores> }) {
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
}
