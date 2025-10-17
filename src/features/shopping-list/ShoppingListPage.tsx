import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
import { useAuth } from '@/features/auth/AuthContext';
import { useShoppingListStore } from '@/stores/shoppingListStore';
import { getCategories } from './services/categoryService';
import type { Category } from '@/features/pantry/types';
import ShoppingListContent from './components/ShoppingListContent';
import { generateShoppingList } from '@/features/shopping-list/shoppingListService';
import useBuscapreciosPricing from './hooks/useBuscapreciosPricing';
import type { NearbyStore } from './types/nearbyStore';
import OffersFinder from './components/OffersFinder';
import { Spinner } from '@/components/ui/Spinner';
import { handleError } from '@/lib/errorHandler';

const useItemsSignature = (itemsLength: number, updatedAtValues: Array<string | null>) =>
  useMemo(() => `${itemsLength}:${updatedAtValues.join('|')}`, [itemsLength, updatedAtValues]);

const ShoppingMapPanel = lazy(() => import('./components/ShoppingMapPanel'));

const ShoppingMapSkeleton = () => (
  <div className="space-y-4 rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">
    <div className="flex items-center gap-3">
      <Spinner size="sm" className="h-4 w-4" />
      Preparando el mapa de supermercados…
    </div>
    <div className="h-[260px] w-full rounded-md border border-dashed bg-muted/30 sm:h-[320px] lg:h-[360px]" />
  </div>
);

export const ShoppingListPage: React.FC = () => {
  const { user } = useAuth();
  const {
    items,
    isLoading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    clearPurchased,
    clearAll,
  } = useShoppingListStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRange, setGeneratedRange] = useState<{ start: string; end: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedPriceItemId, setSelectedPriceItemId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<NearbyStore | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);

  useEffect(() => {
    fetchItems().catch((error) => {
      handleError(error, {
        component: 'ShoppingListPage',
        action: 'fetchItems',
        severity: 'low',
      });
    });
  }, [fetchItems]);

  useEffect(() => {
    setIsLoadingCategories(true);
    getCategories()
      .then((fetched) => setCategories(fetched))
      .catch((error) => {
        handleError(error, {
          component: 'ShoppingListPage',
          action: 'getCategories',
          severity: 'low',
        });
      })
      .finally(() => setIsLoadingCategories(false));
  }, []);

  const itemsSignature = useItemsSignature(
    items.length,
    items.map((item) => item.updated_at ?? '')
  );

  useEffect(() => {
    if (!items.length) {
      setSelectedPriceItemId(null);
      return;
    }

    if (!selectedPriceItemId || !items.some((item) => item.id === selectedPriceItemId)) {
      const candidate = items.find((item) => !item.is_purchased) ?? items[0];
      if (candidate) {
        setSelectedPriceItemId(candidate.id);
      }
    }
  }, [itemsSignature, items, selectedPriceItemId]);

  const { priceByItemId, refreshAll, refreshItem, isRefreshing, lastRefreshAt } = useBuscapreciosPricing(items);

  const selectedSnapshot = selectedPriceItemId ? priceByItemId[selectedPriceItemId] : undefined;

  const priceResults = selectedSnapshot?.products ?? null;

  const itemForPriceSearch = useMemo(() => {
    if (!selectedPriceItemId) return null;
    const match = items.find((item) => item.id === selectedPriceItemId);
    return match ? match.name : null;
  }, [items, selectedPriceItemId]);

  const handleToggleItem = useCallback(
    async (itemId: string, currentStatus: boolean) => {
      await updateItem(itemId, { is_purchased: !currentStatus });
    },
    [updateItem]
  );

  const handleAddItem = useCallback(
    async ({ name, quantity, unit }: { name: string; quantity: number | null; unit: string | null }) => {
      await addItem({
        name,
        quantity,
        unit,
        is_purchased: false,
      });
    },
    [addItem]
  );

  const handleGenerateList = useCallback(async () => {
    if (!user) {
      notifyInfo('Iniciá sesión para generar tu lista automáticamente.');
      return;
    }

    setIsGenerating(true);
    try {
      notifyInfo('Generando lista de compras…', {
        description: 'Analizando tus comidas planificadas y tu despensa.',
      });
      const now = new Date();
      const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const generated = await generateShoppingList(start, end, user.id);
      await fetchItems();
      setGeneratedRange({ start, end });

      if (generated.length) {
        notifySuccess(`Actualizamos tu lista con ${generated.length} ingredientes nuevos.`, {
          description: 'Revisá las categorías para priorizar tus compras.',
        });
      } else {
        notifyInfo('No encontramos ingredientes adicionales.', {
          description: 'Parece que tu despensa cubre todas las comidas de la semana.',
        });
      }
    } catch (error) {
      handleError(error, {
        component: 'ShoppingListPage',
        action: 'generateList',
        severity: 'medium',
        userId: user.id,
      });
      const message = error instanceof Error ? error.message : 'No pudimos generar la lista.';
      notifyError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [fetchItems, user]);

  const handleSelectPriceItem = useCallback(
    (itemId: string) => {
      setSelectedPriceItemId(itemId);
      void refreshItem(itemId);
    },
    [refreshItem]
  );

  const handleRefreshItemPrice = useCallback(
    async (itemId: string) => {
      await refreshItem(itemId);
    },
    [refreshItem]
  );

  const combinedLoading = isLoading || isGenerating;

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          <ShoppingListContent
            items={items}
            isLoading={combinedLoading}
            error={error}
            generatedRange={generatedRange}
            onGenerateList={handleGenerateList}
            onToggleItem={handleToggleItem}
            onDeleteItem={deleteItem}
            onClearPurchased={clearPurchased}
            onClearAll={clearAll}
            onSearchAllPrices={refreshAll}
            isSearchingPrices={isRefreshing}
            priceResults={priceResults}
            itemForPriceSearch={itemForPriceSearch}
            onAddItem={handleAddItem}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            userId={user?.id ?? null}
            pricingByItemId={priceByItemId}
            selectedPriceItemId={selectedPriceItemId}
            onSelectPriceItem={handleSelectPriceItem}
            onRefreshItemPrice={handleRefreshItemPrice}
            lastPriceRefreshAt={lastRefreshAt}
          />
          <OffersFinder
            selectedStore={selectedStore}
            nearbyStores={nearbyStores}
            defaultQuery={itemForPriceSearch ?? undefined}
          />
        </div>
        <div className="space-y-6">
          <Suspense fallback={<ShoppingMapSkeleton />}>
            <ShoppingMapPanel
              selectedStoreId={selectedStore?.id ?? null}
              onSelectStore={setSelectedStore}
              onStoresUpdate={setNearbyStores}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListPage;
