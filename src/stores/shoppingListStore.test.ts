import { act } from 'react';
import { useShoppingListStore, type ShoppingListUIItem } from './shoppingListStore';
import * as shoppingListService from '@/features/shopping-list/shoppingListService';
import type { Database } from '@/lib/database.types';

jest.mock('@/features/shopping-list/shoppingListService');

const mockedShoppingListService = shoppingListService as jest.Mocked<typeof shoppingListService>;

type DBShoppingListRow = Database['public']['Tables']['shopping_list_items']['Row'];

const makeDbRow = (overrides: Partial<DBShoppingListRow> = {}): DBShoppingListRow => ({
  id: 'sl1',
  user_id: 'u1',
  name: 'Milk',
  quantity: null,
  unit: null,
  is_purchased: false,
  created_at: '2023-01-01T10:00:00Z',
  updated_at: '2023-01-01T10:00:00Z',
  category_id: null,
  category_label: null,
  ingredient_id: null,
  ingredient_name: null,
  notes: null,
  ...overrides
});

const makeUiItem = (overrides: Partial<ShoppingListUIItem> = {}): ShoppingListUIItem => ({
  id: 'ui1',
  user_id: 'u1',
  name: 'Yogurt',
  quantity: null,
  unit: null,
  is_purchased: false,
  created_at: '2023-01-02T10:00:00Z',
  updated_at: '2023-01-02T10:00:00Z',
  ...overrides
});

describe('useShoppingListStore', () => {
  beforeEach(() => {
    useShoppingListStore.setState({ items: [], isLoading: false, error: null });
    jest.resetAllMocks();
  });

  it('fetchItems should update state on success', async () => {
    const row1 = makeDbRow();
    const row2 = makeDbRow({
      id: 'sl2',
      name: 'Eggs',
      is_purchased: true,
      created_at: '2023-01-03T10:00:00Z'
    });
    mockedShoppingListService.getShoppingListItems.mockResolvedValue([row1, row2]);

    await act(async () => {
      await useShoppingListStore.getState().fetchItems();
    });

    const state = useShoppingListStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.items.map((item) => ({ id: item.id, is_purchased: item.is_purchased }))).toEqual([
      { id: 'sl1', is_purchased: false },
      { id: 'sl2', is_purchased: true }
    ]);
    expect(mockedShoppingListService.getShoppingListItems).toHaveBeenCalledTimes(1);
  });

  it('fetchItems should set error state on failure', async () => {
    mockedShoppingListService.getShoppingListItems.mockRejectedValue(new Error('fetch failed'));

    await act(async () => {
      await useShoppingListStore.getState().fetchItems();
    });

    const state = useShoppingListStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('fetch failed');
    expect(state.items).toEqual([]);
  });

  it('fetchItems should not refetch if already loading', async () => {
    useShoppingListStore.setState({ isLoading: true });

    await act(async () => {
      await useShoppingListStore.getState().fetchItems();
    });

    expect(mockedShoppingListService.getShoppingListItems).not.toHaveBeenCalled();
  });

  it('addItem should append item and keep pending first', async () => {
    const purchasedItem = makeUiItem({ id: 'ui2', name: 'Eggs', is_purchased: true });
    useShoppingListStore.setState({ items: [purchasedItem], isLoading: false, error: null });

    const createdRow = makeDbRow({
      id: 'sl-new',
      name: 'Bread',
      created_at: '2023-01-04T10:00:00Z'
    });
    mockedShoppingListService.addShoppingListItem.mockResolvedValue(createdRow);

    let result: ShoppingListUIItem | null = null;
    await act(async () => {
      result = await useShoppingListStore.getState().addItem({
        name: 'Bread',
        quantity: null,
        unit: null,
        is_purchased: false
      });
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'sl-new',
        name: 'Bread',
        is_purchased: false
      })
    );
    const items = useShoppingListStore.getState().items;
    expect(items.map((item) => item.id)).toEqual(['sl-new', 'ui2']);
    expect(mockedShoppingListService.addShoppingListItem).toHaveBeenCalledWith({
      name: 'Bread',
      quantity: null,
      unit: null,
      is_purchased: false
    });
  });

  it('addItem should return null on failure', async () => {
    mockedShoppingListService.addShoppingListItem.mockRejectedValue(new Error('add failed'));

    let result: ShoppingListUIItem | null = null;
    await act(async () => {
      result = await useShoppingListStore.getState().addItem({
        name: 'Bread',
        quantity: null,
        unit: null,
        is_purchased: false
      });
    });

    expect(result).toBeNull();
    expect(useShoppingListStore.getState().items).toEqual([]);
  });

  it('updateItem should optimistically update and resort', async () => {
    const item1 = makeUiItem({ id: 'ui1', name: 'Milk', is_purchased: false });
    const item2 = makeUiItem({
      id: 'ui2',
      name: 'Eggs',
      is_purchased: false,
      created_at: '2023-01-05T10:00:00Z'
    });
    useShoppingListStore.setState({ items: [item1, item2], isLoading: false, error: null });

    const updatedRow = makeDbRow({
      id: 'ui1',
      name: 'Milk',
      is_purchased: true
    });
    mockedShoppingListService.updateShoppingListItem.mockResolvedValue(updatedRow);

    let result: ShoppingListUIItem | null = null;
    await act(async () => {
      result = await useShoppingListStore.getState().updateItem('ui1', { is_purchased: true });
    });

    expect(result).toEqual(expect.objectContaining({ id: 'ui1', is_purchased: true }));
    const items = useShoppingListStore.getState().items;
    expect(items.map((item) => ({ id: item.id, purchased: item.is_purchased }))).toEqual([
      { id: 'ui2', purchased: false },
      { id: 'ui1', purchased: true }
    ]);
  });

  it('updateItem should revert state on failure', async () => {
    const item1 = makeUiItem({ id: 'ui1', name: 'Milk', is_purchased: false });
    const item2 = makeUiItem({ id: 'ui2', name: 'Eggs', is_purchased: true });
    useShoppingListStore.setState({ items: [item1, item2], isLoading: false, error: null });

    mockedShoppingListService.updateShoppingListItem.mockRejectedValue(new Error('update failed'));

    let result: ShoppingListUIItem | null = null;
    await act(async () => {
      result = await useShoppingListStore.getState().updateItem('ui1', { is_purchased: true });
    });

    expect(result).toBeNull();
    const items = useShoppingListStore.getState().items;
    expect(items).toEqual([item1, item2]);
  });

  it('deleteItem should optimistically remove and restore on failure', async () => {
    const item1 = makeUiItem({ id: 'ui1' });
    const item2 = makeUiItem({ id: 'ui2' });
    useShoppingListStore.setState({ items: [item1, item2], isLoading: false, error: null });

    mockedShoppingListService.deleteShoppingListItem.mockResolvedValue();

    let success = false;
    await act(async () => {
      success = await useShoppingListStore.getState().deleteItem('ui1');
    });

    expect(success).toBe(true);
    expect(useShoppingListStore.getState().items).toEqual([item2]);

    mockedShoppingListService.deleteShoppingListItem.mockRejectedValue(new Error('delete failed'));
    useShoppingListStore.setState({ items: [item1, item2] });

    await act(async () => {
      success = await useShoppingListStore.getState().deleteItem('ui1');
    });

    expect(success).toBe(false);
    expect(useShoppingListStore.getState().items).toEqual([item1, item2]);
  });

  it('clearPurchased should keep pending items and revert on failure', async () => {
    const pending = makeUiItem({ id: 'pending', is_purchased: false });
    const purchased = makeUiItem({ id: 'purchased', is_purchased: true });
    useShoppingListStore.setState({ items: [pending, purchased], isLoading: false, error: null });

    mockedShoppingListService.clearPurchasedItems.mockResolvedValue();

    let success = false;
    await act(async () => {
      success = await useShoppingListStore.getState().clearPurchased();
    });

    expect(success).toBe(true);
    expect(useShoppingListStore.getState().items).toEqual([pending]);

    mockedShoppingListService.clearPurchasedItems.mockRejectedValue(new Error('clear failed'));
    useShoppingListStore.setState({ items: [pending, purchased] });

    await act(async () => {
      success = await useShoppingListStore.getState().clearPurchased();
    });

    expect(success).toBe(false);
    expect(useShoppingListStore.getState().items).toEqual([pending, purchased]);
  });

  it('clearAll should empty list and revert on failure', async () => {
    const item1 = makeUiItem({ id: 'ui1' });
    const item2 = makeUiItem({ id: 'ui2' });
    useShoppingListStore.setState({ items: [item1, item2], isLoading: false, error: null });

    mockedShoppingListService.clearAllItems.mockResolvedValue();

    let success = false;
    await act(async () => {
      success = await useShoppingListStore.getState().clearAll();
    });

    expect(success).toBe(true);
    expect(useShoppingListStore.getState().items).toEqual([]);

    mockedShoppingListService.clearAllItems.mockRejectedValue(new Error('clear all failed'));
    useShoppingListStore.setState({ items: [item1, item2] });

    await act(async () => {
      success = await useShoppingListStore.getState().clearAll();
    });

    expect(success).toBe(false);
    expect(useShoppingListStore.getState().items).toEqual([item1, item2]);
  });
});
