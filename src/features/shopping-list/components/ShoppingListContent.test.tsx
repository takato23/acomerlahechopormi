import type { ComponentProps } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ShoppingListContent from './ShoppingListContent';

jest.mock('@/lib/notifications', () => ({
  notifySuccess: jest.fn(),
  notifyError: jest.fn(),
  notifyInfo: jest.fn(),
}));

const mockPreferencesState = {
  preferencesByUser: {
    __anonymous__: {
      manualOrder: [] as string[],
      viewMode: 'flat' as const,
      filters: {
        searchTerm: '',
        categoryId: null,
        showPurchased: false,
      },
    },
  },
  setFilters: jest.fn(),
  setViewMode: jest.fn(),
  updateManualOrder: jest.fn(),
  ensureOrderContains: jest.fn(),
};

jest.mock('@/stores/shoppingListPreferencesStore', () => {
  const actual = jest.requireActual('@/stores/shoppingListPreferencesStore');

  const mockStore = (selector: (state: typeof mockPreferencesState) => unknown) =>
    selector(mockPreferencesState);

  mockStore.setState = jest.fn();
  mockStore.getState = () => mockPreferencesState;

  return {
    ...actual,
    useShoppingListPreferencesStore: mockStore,
  };
});

const noop = jest.fn;
const { notifyError, notifySuccess } = jest.requireMock('@/lib/notifications');

const baseItems = [
  {
    id: '1',
    user_id: 'user',
    name: 'Pan',
    quantity: 1,
    unit: 'u',
    is_purchased: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const renderComponent = (overrides: Partial<ComponentProps<typeof ShoppingListContent>> = {}) =>
  render(
    <ShoppingListContent
      items={baseItems}
      isLoading={false}
      error={null}
      generatedRange={null}
      onGenerateList={noop()}
      onToggleItem={noop()}
      onDeleteItem={async () => true}
      onClearPurchased={async () => true}
      onClearAll={async () => true}
      onSearchAllPrices={noop()}
      isSearchingPrices={false}
      priceResults={null}
      itemForPriceSearch={null}
      onAddItem={async () => undefined}
      categories={[]}
      isLoadingCategories={false}
      userId={'user'}
      pricingByItemId={{}}
      selectedPriceItemId={null}
      onSelectPriceItem={noop()}
      onRefreshItemPrice={async () => undefined}
      lastPriceRefreshAt={null}
      {...overrides}
    />
  );

describe('ShoppingListContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton when loading with no items', () => {
    render(
      <ShoppingListContent
        items={[]}
        isLoading={true}
        error={null}
        generatedRange={null}
        onGenerateList={noop()}
        onToggleItem={noop()}
        onDeleteItem={async () => false}
        onClearPurchased={async () => false}
        onClearAll={async () => false}
        onSearchAllPrices={noop()}
        isSearchingPrices={false}
        priceResults={null}
        itemForPriceSearch={null}
        onAddItem={async () => undefined}
        categories={[]}
        isLoadingCategories={false}
        userId={null}
        pricingByItemId={{}}
        selectedPriceItemId={null}
        onSelectPriceItem={noop()}
        onRefreshItemPrice={async () => undefined}
        lastPriceRefreshAt={null}
      />
    );

    expect(screen.getByTestId('shopping-list-content-skeleton')).toBeInTheDocument();
  });

  it('shows error toast when quantity is invalid', () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText('Ítem'), { target: { value: 'Leche' } });
    fireEvent.change(screen.getByLabelText('Cantidad'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /Añadir a la lista/i }));

    expect(notifyError).toHaveBeenCalledWith('Ingresá una cantidad válida.');
  });

  it('shows success toast when clearing purchased items succeeds', async () => {
    const onClearPurchased = jest.fn().mockResolvedValue(true);
    renderComponent({ onClearPurchased });

    fireEvent.click(screen.getByRole('button', { name: /Limpiar comprados/i }));

    await waitFor(() => {
      expect(notifySuccess).toHaveBeenCalledWith('Limpiamos los ítems marcados como comprados.');
    });
  });
});
