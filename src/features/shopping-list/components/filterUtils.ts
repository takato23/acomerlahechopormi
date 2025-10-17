import type { ShoppingListUIItem } from '@/stores/shoppingListStore';
import type { ShoppingListFilters } from '@/stores/shoppingListPreferencesStore';

export const UNCATEGORIZED_KEY = 'uncategorized';

export function filterShoppingListItems(
  items: ShoppingListUIItem[],
  filters: ShoppingListFilters,
): ShoppingListUIItem[] {
  const searchTerm = filters.searchTerm.trim().toLowerCase();

  return items.filter((item) => {
    if (!filters.showPurchased && item.is_purchased) {
      return false;
    }

    if (filters.categoryId) {
      if (filters.categoryId === UNCATEGORIZED_KEY) {
        if (item.category_id) return false;
      } else if (item.category_id !== filters.categoryId) {
        return false;
      }
    }

    if (searchTerm && !item.name.toLowerCase().includes(searchTerm)) {
      return false;
    }

    return true;
  });
}
