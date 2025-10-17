import { filterShoppingListItems, UNCATEGORIZED_KEY } from '../filterUtils';
import type { ShoppingListUIItem } from '@/stores/shoppingListStore';
import type { ShoppingListFilters } from '@/stores/shoppingListPreferencesStore';

const buildItem = (overrides: Partial<ShoppingListUIItem>): ShoppingListUIItem => ({
  id: overrides.id ?? `item-${Math.random()}`,
  user_id: overrides.user_id ?? 'user-1',
  name: overrides.name ?? 'Item',
  quantity: overrides.quantity ?? null,
  unit: overrides.unit ?? null,
  is_purchased: overrides.is_purchased ?? false,
  notes: overrides.notes ?? null,
  created_at: overrides.created_at ?? new Date().toISOString(),
  updated_at: overrides.updated_at ?? new Date().toISOString(),
  category_id: overrides.category_id ?? null,
  category_label: overrides.category_label ?? null,
});

const baseFilters: ShoppingListFilters = {
  searchTerm: '',
  categoryId: null,
  showPurchased: false,
};

describe('filterShoppingListItems', () => {
  it('filters by search term when provided', () => {
    const items = [buildItem({ name: 'Manzana' }), buildItem({ name: 'Banana' })];
    const result = filterShoppingListItems(items, { ...baseFilters, searchTerm: 'manz' });
    expect(result.map((item) => item.name)).toEqual(['Manzana']);
  });

  it('filters by category id including uncategorized sentinel', () => {
    const items = [
      buildItem({ id: '1', name: 'Manzana', category_id: 'fruit' }),
      buildItem({ id: '2', name: 'Lechuga', category_id: 'veg' }),
      buildItem({ id: '3', name: 'Sal', category_id: null }),
    ];

    const fruit = filterShoppingListItems(items, { ...baseFilters, categoryId: 'fruit' });
    expect(fruit.map((item) => item.name)).toEqual(['Manzana']);

    const uncategorized = filterShoppingListItems(items, {
      ...baseFilters,
      categoryId: UNCATEGORIZED_KEY,
    });
    expect(uncategorized.map((item) => item.name)).toEqual(['Sal']);
  });

  it('includes purchased items only when showPurchased is enabled', () => {
    const items = [
      buildItem({ id: '1', name: 'Manzana', is_purchased: false }),
      buildItem({ id: '2', name: 'Pan', is_purchased: true }),
    ];

    const pendingOnly = filterShoppingListItems(items, baseFilters);
    expect(pendingOnly.map((item) => item.name)).toEqual(['Manzana']);

    const withPurchased = filterShoppingListItems(items, {
      ...baseFilters,
      showPurchased: true,
    });
    expect(withPurchased.map((item) => item.name)).toEqual(['Manzana', 'Pan']);
  });
});
