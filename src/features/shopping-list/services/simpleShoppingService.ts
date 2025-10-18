import localforage from 'localforage';
import { supabase } from '@/lib/supabaseClient';

export interface SimpleShoppingItem {
  id: string;
  name: string;
  is_checked: boolean;
  created_at: string;
  user_id?: string;
}

export interface SimpleShoppingItemInsert {
  name: string;
  is_checked?: boolean;
  user_id?: string;
}

const TABLE_NAME = 'simple_shopping_items';
const OFFLINE_STORE = localforage.createInstance({
  name: 'a-comerla',
  storeName: 'simple-shopping-items',
});
const OFFLINE_ITEMS_KEY = 'items';

const generateLocalId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `offline-${Math.random().toString(36).slice(2, 11)}`;
};

const isNavigatorOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

interface OfflineSimpleShoppingItem extends SimpleShoppingItem {
  status: 'synced' | 'pending-add' | 'pending-update' | 'pending-delete';
  remoteId?: string;
}

const readOfflineItems = async (): Promise<OfflineSimpleShoppingItem[]> => {
  try {
    const stored = await OFFLINE_STORE.getItem<OfflineSimpleShoppingItem[]>(OFFLINE_ITEMS_KEY);
    return stored ?? [];
  } catch (error) {
    console.error('[simpleShoppingService] Error reading offline items:', error);
    return [];
  }
};

const writeOfflineItems = async (items: OfflineSimpleShoppingItem[]): Promise<void> => {
  try {
    await OFFLINE_STORE.setItem(OFFLINE_ITEMS_KEY, items);
  } catch (error) {
    console.error('[simpleShoppingService] Error writing offline items:', error);
  }
};

const stripOfflineMetadata = (item: OfflineSimpleShoppingItem): SimpleShoppingItem => ({
  id: item.id,
  name: item.name,
  is_checked: item.is_checked,
  created_at: item.created_at,
  user_id: item.user_id,
});

const getVisibleOfflineItems = (items: OfflineSimpleShoppingItem[]): SimpleShoppingItem[] =>
  items.filter(item => item.status !== 'pending-delete').map(stripOfflineMetadata);

const toOfflineSynced = (item: SimpleShoppingItem): OfflineSimpleShoppingItem => ({
  ...item,
  status: 'synced',
  remoteId: item.id,
});

const syncOfflineChanges = async (
  userId: string,
  cachedItems?: OfflineSimpleShoppingItem[]
): Promise<OfflineSimpleShoppingItem[]> => {
  const items = cachedItems ?? await readOfflineItems();
  if (!items.length) {
    return items;
  }

  const syncedItems: OfflineSimpleShoppingItem[] = [];

  for (const item of items) {
    try {
      if (item.status === 'pending-delete') {
        if (item.remoteId) {
          const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', item.remoteId);

          if (error) {
            console.error('[simpleShoppingService] Error deleting remote item during sync:', error);
            syncedItems.push(item);
            continue;
          }
        }
        // Item removed locally and remotely
        continue;
      }

      if (item.status === 'pending-add') {
        const payload: SimpleShoppingItemInsert = {
          name: item.name,
          is_checked: item.is_checked,
          user_id: userId,
        };

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .insert(payload)
          .select()
          .single();

        if (error || !data) {
          console.error('[simpleShoppingService] Error adding remote item during sync:', error);
          syncedItems.push(item);
          continue;
        }

        syncedItems.push(toOfflineSynced(data));
        continue;
      }

      if (item.status === 'pending-update') {
        const targetId = item.remoteId ?? item.id;
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update({ is_checked: item.is_checked, name: item.name })
          .eq('id', targetId)
          .select()
          .single();

        if (error || !data) {
          console.error('[simpleShoppingService] Error updating remote item during sync:', error);
          syncedItems.push(item);
          continue;
        }

        syncedItems.push(toOfflineSynced(data));
        continue;
      }

      // Already synced
      syncedItems.push({ ...item, status: 'synced', remoteId: item.remoteId ?? item.id });
    } catch (error) {
      console.error('[simpleShoppingService] Unexpected sync error:', error);
      syncedItems.push(item);
    }
  }

  await writeOfflineItems(syncedItems);
  return syncedItems;
};

export async function getSimpleShoppingItems(): Promise<SimpleShoppingItem[]> {
  const offlineItems = await readOfflineItems();

  try {
    const { data: authData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('[simpleShoppingService] Error obteniendo usuario:', userError);
      return getVisibleOfflineItems(offlineItems);
    }

    const user = authData?.user;
    if (!user || isNavigatorOffline()) {
      return getVisibleOfflineItems(offlineItems);
    }

    const syncedItems = await syncOfflineChanges(user.id, offlineItems);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[simpleShoppingService] Error al obtener items:', error);
      return getVisibleOfflineItems(syncedItems);
    }

    const remoteItems = data ?? [];

    // Separate synced items from pending ones to preserve offline changes that failed to sync
    const successfullySyncedItems = syncedItems.filter(item => item.status === 'synced');
    const pendingItems = syncedItems.filter(item => item.status !== 'synced');

    // Create a map of remote items for quick lookup
    const remoteItemsMap = new Map(remoteItems.map(item => [item.id, item]));

    // Merge remote items with successfully synced local changes
    const mergedItems: OfflineSimpleShoppingItem[] = remoteItems.map(remoteItem => {
      const syncedVersion = successfullySyncedItems.find(item => item.remoteId === remoteItem.id);
      return syncedVersion || toOfflineSynced(remoteItem);
    });

    // Add any pending items that don't exist remotely (new items that failed to sync)
    const pendingNewItems = pendingItems.filter(item =>
      item.status === 'pending-add' && !remoteItemsMap.has(item.remoteId || '')
    );
    mergedItems.push(...pendingNewItems);

    await writeOfflineItems(mergedItems);
    return remoteItems;
  } catch (error) {
    console.error('[simpleShoppingService] Error inesperado:', error);
    return getVisibleOfflineItems(offlineItems);
  }
}

export async function addSimpleShoppingItem(name: string): Promise<SimpleShoppingItem | null> {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const offlineItems = await readOfflineItems();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  const offlineOnly = !user || isNavigatorOffline();

  if (offlineOnly) {
    const newItem: OfflineSimpleShoppingItem = {
      id: generateLocalId(),
      name: trimmedName,
      is_checked: false,
      created_at: new Date().toISOString(),
      user_id: user?.id,
      status: 'pending-add',
    };
    await writeOfflineItems([newItem, ...offlineItems]);
    return stripOfflineMetadata(newItem);
  }

  try {
    const payload: SimpleShoppingItemInsert = {
      name: trimmedName,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      throw error;
    }

    const updatedOffline = [toOfflineSynced(data), ...offlineItems.filter(item => (item.remoteId ?? item.id) !== data.id)];
    await writeOfflineItems(updatedOffline);
    return data;
  } catch (error) {
    console.error('[simpleShoppingService] Error al insertar:', error);
    const fallbackItem: OfflineSimpleShoppingItem = {
      id: generateLocalId(),
      name: trimmedName,
      is_checked: false,
      created_at: new Date().toISOString(),
      user_id: user?.id,
      status: 'pending-add',
    };
    await writeOfflineItems([fallbackItem, ...offlineItems]);
    return stripOfflineMetadata(fallbackItem);
  }
}

export async function updateSimpleShoppingItem(id: string, is_checked: boolean): Promise<SimpleShoppingItem | null> {
  const offlineItems = await readOfflineItems();
  const index = offlineItems.findIndex(item => item.id === id || item.remoteId === id);
  const existingItem = index >= 0 ? offlineItems[index] : null;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  const offlineOnly = !user || isNavigatorOffline();

  if (existingItem) {
    const updatedLocal: OfflineSimpleShoppingItem = {
      ...existingItem,
      is_checked,
      status: existingItem.status === 'pending-add' ? 'pending-add' : offlineOnly ? 'pending-update' : existingItem.status,
    };
    offlineItems[index] = updatedLocal;
    await writeOfflineItems(offlineItems);
    if (offlineOnly) {
      return stripOfflineMetadata(updatedLocal);
    }
  } else if (offlineOnly) {
    return null;
  }

  if (!user) {
    return existingItem ? stripOfflineMetadata(existingItem) : null;
  }

  try {
    const targetId = existingItem?.remoteId ?? id;
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ is_checked })
      .eq('id', targetId)
      .select()
      .single();

    if (error || !data) {
      throw error;
    }

    const updatedOffline = existingItem
      ? offlineItems.map(item => (item === existingItem ? toOfflineSynced(data) : item))
      : [toOfflineSynced(data), ...offlineItems];
    await writeOfflineItems(updatedOffline);
    return data;
  } catch (error) {
    console.error('[simpleShoppingService] Error al actualizar:', error);
    return existingItem ? stripOfflineMetadata({ ...existingItem, is_checked, status: 'pending-update' }) : null;
  }
}

export async function deleteSimpleShoppingItem(id: string): Promise<boolean> {
  const offlineItems = await readOfflineItems();
  const index = offlineItems.findIndex(item => item.id === id || item.remoteId === id);
  const existingItem = index >= 0 ? offlineItems[index] : null;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  const offlineOnly = !user || isNavigatorOffline();

  if (existingItem) {
    if (existingItem.status === 'pending-add') {
      offlineItems.splice(index, 1);
    } else {
      offlineItems[index] = { ...existingItem, status: 'pending-delete' };
    }
    await writeOfflineItems(offlineItems);
  }

  if (offlineOnly || !user || !existingItem) {
    return true;
  }

  try {
    const targetId = existingItem.remoteId ?? id;
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', targetId);

    if (error) {
      throw error;
    }

    const cleaned = (await readOfflineItems()).filter(item => item.status !== 'pending-delete');
    await writeOfflineItems(cleaned);
    return true;
  } catch (error) {
    console.error('[simpleShoppingService] Error al eliminar item:', error);
    return false;
  }
}

export async function clearCheckedItems(): Promise<boolean> {
  const offlineItems = await readOfflineItems();
  const remainingOffline = offlineItems.map(item => {
    if (!item.is_checked) {
      return item;
    }

    if (item.status === 'pending-add') {
      return null;
    }

    return { ...item, status: 'pending-delete' };
  }).filter((item): item is OfflineSimpleShoppingItem => Boolean(item));

  await writeOfflineItems(remainingOffline);

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  if (!user || isNavigatorOffline()) {
    return true;
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', user.id)
      .eq('is_checked', true);

    if (error) {
      throw error;
    }

    const cleaned = (await readOfflineItems()).filter(item => item.status !== 'pending-delete');
    await writeOfflineItems(cleaned);
    return true;
  } catch (error) {
    console.error('[simpleShoppingService] Error al limpiar items marcados:', error);
    return false;
  }
}
