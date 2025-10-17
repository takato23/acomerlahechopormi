import { render, fireEvent, waitFor } from '@testing-library/react';
import ShoppingListContent from './ShoppingListContent';
import type { ComponentProps } from 'react';

jest.mock('@/lib/notifications', () => ({
  notifySuccess: jest.fn(),
  notifyError: jest.fn(),
  notifyInfo: jest.fn(),
}));

jest.mock('./VirtualizedShoppingList', () => ({
  VirtualizedShoppingList: ({ items, onToggleItem, onDeleteItem }: any) => (
    <div data-testid="mock-virtualized-list">
      {items.map((item: any) => (
        <div key={item.id}>
          <button type="button" onClick={() => onToggleItem(item.id, item.is_purchased)}>
            Marcar {item.name}
          </button>
          <button type="button" onClick={() => onDeleteItem(item.id)}>
            Eliminar {item.name}
          </button>
        </div>
      ))}
    </div>
  ),
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

type MockState = typeof mockPreferencesState;

jest.mock('@/stores/shoppingListPreferencesStore', () => {
  const actual = jest.requireActual('@/stores/shoppingListPreferencesStore');

  const mockStore = (selector: (state: MockState) => unknown) => selector(mockPreferencesState);
  mockStore.setState = jest.fn();
  mockStore.getState = () => mockPreferencesState;

  return {
    ...actual,
    useShoppingListPreferencesStore: mockStore,
  };
});

const noopPricing: ComponentProps<typeof ShoppingListContent>['pricingByItemId'] = {};

describe('ShoppingListContent full flow', () => {
  it('permite generar, añadir, marcar y eliminar ítems', async () => {
    const onGenerateList = jest.fn();
    const onAddItem = jest.fn().mockResolvedValue(undefined);
    const onToggleItem = jest.fn();
    const onDeleteItem = jest.fn().mockResolvedValue(undefined);

    const { getByRole, getByLabelText } = render(
      <ShoppingListContent
        items={[
          {
            id: 'item-1',
            user_id: 'user-1',
            name: 'Manzana',
            quantity: 1,
            unit: 'u',
            is_purchased: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]}
        isLoading={false}
        error={null}
        generatedRange={null}
        onGenerateList={onGenerateList}
        onToggleItem={onToggleItem}
        onDeleteItem={onDeleteItem}
        onClearPurchased={async () => true}
        onClearAll={async () => true}
        onSearchAllPrices={() => undefined}
        isSearchingPrices={false}
        priceResults={null}
        itemForPriceSearch={null}
        onAddItem={onAddItem}
        categories={[]}
        isLoadingCategories={false}
        userId={'user-1'}
        pricingByItemId={noopPricing}
        selectedPriceItemId={null}
        onSelectPriceItem={() => undefined}
        onRefreshItemPrice={async () => undefined}
        lastPriceRefreshAt={null}
      />
    );

    fireEvent.click(getByRole('button', { name: /Generar lista/i }));
    expect(onGenerateList).toHaveBeenCalled();

    fireEvent.change(getByLabelText('Ítem'), { target: { value: 'Banana' } });
    fireEvent.change(getByLabelText('Cantidad'), { target: { value: '2' } });
    fireEvent.click(getByRole('button', { name: /Añadir a la lista/i }));

    await waitFor(() => {
      expect(onAddItem).toHaveBeenCalledWith({
        name: 'Banana',
        quantity: 2,
        unit: null,
      });
    });

    const toggleButton = getByRole('button', { name: /Marcar Manzana/i });
    fireEvent.click(toggleButton);
    expect(onToggleItem).toHaveBeenCalledWith('item-1', false);

    const deleteButton = getByRole('button', { name: /Eliminar Manzana/i });
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(onDeleteItem).toHaveBeenCalledWith('item-1');
    });
  });
});
