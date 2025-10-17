import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { VirtualizedShoppingList } from './VirtualizedShoppingList';
import type { ShoppingListUIItem } from '@/stores/shoppingListStore';
import { useShoppingListPreferencesStore, DEFAULT_PREFERENCES, ANONYMOUS_USER_KEY, type ShoppingListFilters } from '@/stores/shoppingListPreferencesStore';
import type { Category } from '@/features/pantry/types';
import type { BuscaPreciosProduct } from '../services/buscaPreciosService';
import type { ItemPriceSnapshot } from '../hooks/useBuscapreciosPricing';
import { getPriceRange } from '../services/buscaPreciosService';
import { getPriceHistory, PriceHistoryPoint } from '../lib/priceHistory';
import { ResponsiveContainer, Line, LineChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import {
  Filter,
  LayoutList,
  LayoutGrid,
  ListChecks,
  Search,
  XCircle,
  ArrowRight,
  History,
} from 'lucide-react';
import { filterShoppingListItems, UNCATEGORIZED_KEY } from './filterUtils';
import { ShoppingListContentSkeleton } from './ShoppingListContentSkeleton';

interface ShoppingListContentProps {
  items: ShoppingListUIItem[];
  isLoading: boolean;
  error: string | null;
  generatedRange: { start: string; end: string } | null;
  onGenerateList: () => Promise<void> | void;
  onToggleItem: (itemId: string, currentStatus: boolean) => Promise<void> | void;
  onDeleteItem: (itemId: string) => Promise<boolean> | void;
  onClearPurchased: () => Promise<boolean>;
  onClearAll: () => Promise<boolean>;
  onSearchAllPrices: () => Promise<void> | void;
  isSearchingPrices: boolean;
  priceResults: BuscaPreciosProduct[] | null;
  itemForPriceSearch: string | null;
  onAddItem: (parsedItem: { name: string; quantity: number | null; unit: string | null }) => Promise<void>;
  categories: Category[];
  isLoadingCategories: boolean;
  userId: string | null;
  pricingByItemId: Record<string, ItemPriceSnapshot>;
  selectedPriceItemId: string | null;
  onSelectPriceItem: (itemId: string) => void;
  onRefreshItemPrice: (itemId: string) => Promise<void> | void;
  lastPriceRefreshAt: number | null;
}

const formatRange = (range: { start: string; end: string } | null) => {
  if (!range) return '';
  try {
    const start = new Date(`${range.start}T00:00:00`);
    const end = new Date(`${range.end}T00:00:00`);
    return `para la semana del ${format(start, 'd MMM', { locale: es })} al ${format(end, 'd MMM yyyy', { locale: es })}`;
  } catch (error) {
    console.warn('No se pudo formatear el rango de fechas de la lista.', error);
    return `del ${range.start} al ${range.end}`;
  }
};

interface PriceResultsPanelProps {
  results: BuscaPreciosProduct[] | null;
  itemName: string | null;
  isLoading: boolean;
}

const PriceResultsPanel: React.FC<PriceResultsPanelProps> = ({ results, itemName, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/20 text-center">
        <Spinner size="sm" className="inline-block mr-2" />
        Buscando precios para "{itemName}"...
      </div>
    );
  }

  if (!results || results.length === 0) {
    if (itemName) {
      return (
        <div className="p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground">
          No se encontraron precios online para "{itemName}".
        </div>
      );
    }
    return null;
  }

  const priceSummary = getPriceRange(results);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">Precios encontrados para "{itemName}"</CardTitle>
            <p className="text-xs text-muted-foreground">
              Min: ${priceSummary.min.toFixed(2)} · Promedio: ${priceSummary.avg.toFixed(2)} · Máx: ${priceSummary.max.toFixed(2)}
            </p>
          </div>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((product) => {
          const history = getPriceHistory(product.id);
          const chartData = history.map((point: PriceHistoryPoint) => ({
            price: point.price,
            timestamp: point.timestamp,
            label: format(new Date(point.timestamp), 'd MMM', { locale: es }),
          }));

          return (
            <div
              key={product.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border rounded-md bg-background hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={product.imagen || '/placeholder.svg'}
                  alt={product.nombre}
                  className="h-12 w-12 object-contain rounded-sm border"
                  onError={(event) => {
                    event.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div>
                  <p className="text-sm font-medium leading-tight">{product.nombre}</p>
                  <p className="text-xs text-muted-foreground">{product.tienda}</p>
                </div>
              </div>
              <div className="flex-1 min-w-[180px] h-24">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                      <XAxis dataKey="label" hide tick={{ fontSize: 10 }} />
                      <YAxis domain={['dataMin', 'dataMax']} hide />
                      <RechartsTooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Precio']}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded">
                    Sin historial suficiente
                  </div>
                )}
              </div>
              <div className="text-right min-w-[120px]">
                <p className="text-sm font-semibold">
                  ${product.precio.toFixed(2)}
                </p>
                {product.url && product.url !== '#' && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Ver tienda <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const ShoppingListContent: React.FC<ShoppingListContentProps> = ({
  items,
  isLoading,
  error,
  generatedRange,
  onGenerateList,
  onToggleItem,
  onDeleteItem,
  onClearPurchased,
  onClearAll,
  onSearchAllPrices,
  isSearchingPrices,
  priceResults,
  itemForPriceSearch,
  onAddItem,
  categories,
  isLoadingCategories,
  userId,
  pricingByItemId,
  selectedPriceItemId,
  onSelectPriceItem,
  onRefreshItemPrice,
  lastPriceRefreshAt,
}) => {
  const normalizedUserKey = userId ?? ANONYMOUS_USER_KEY;

  const { filters, viewMode } = useShoppingListPreferencesStore((state) => {
    const prefs = state.preferencesByUser[normalizedUserKey] ?? DEFAULT_PREFERENCES;
    return {
      filters: prefs.filters,
      viewMode: prefs.viewMode,
    };
  });

  const setFilters = useShoppingListPreferencesStore((state) => state.setFilters);
  const setViewMode = useShoppingListPreferencesStore((state) => state.setViewMode);
  const ensureOrderContains = useShoppingListPreferencesStore((state) => state.ensureOrderContains);
  const manualOrder = useShoppingListPreferencesStore((state) => {
    const prefs = state.preferencesByUser[normalizedUserKey] ?? DEFAULT_PREFERENCES;
    return prefs.manualOrder ?? [];
  });

  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [isClearingPurchased, setIsClearingPurchased] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const addItemInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const lastRefreshLabel = useMemo(() => {
    if (!lastPriceRefreshAt) {
      return 'Precios sin actualizar recientemente';
    }
    return `Precios actualizados ${formatDistanceToNow(lastPriceRefreshAt, {
      addSuffix: true,
      locale: es,
    })}`;
  }, [lastPriceRefreshAt]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    // Solo actualizar el orden si hay ítems nuevos o el orden cambió significativamente
    const pendingItems = items.filter((item) => !item.is_purchased);
    const currentIds = pendingItems.map((item) => item.id);

    ensureOrderContains(userId ?? null, currentIds);
  }, [items.length, userId]); // Solo dependemos de la longitud y userId

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isModKey = event.metaKey || event.ctrlKey;
      if (isModKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (isModKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        addItemInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderPriceBadge = useCallback(
    (item: ShoppingListUIItem) => {
      const snapshot = pricingByItemId[item.id];
      const bestLabel =
        snapshot && snapshot.bestPrice !== null && snapshot.bestPrice !== undefined
          ? `$${snapshot.bestPrice.toFixed(2)}`
          : null;

      if (!snapshot || snapshot.status === 'idle') {
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectPriceItem(item.id)}
            className="h-6 px-2 text-[11px]"
          >
            Ver precios
          </Button>
        );
      }

      if (snapshot.status === 'loading') {
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
            <Spinner size="sm" className="h-3 w-3" />
            Actualizando…
          </Badge>
        );
      }

      if (snapshot.status === 'error') {
        return (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => {
              void onRefreshItemPrice(item.id);
            }}
            className="h-auto px-0 text-[11px] text-destructive"
          >
            Reintentar precios
          </Button>
        );
      }

      if (snapshot.status === 'success' && bestLabel) {
        return (
          <Button
            type="button"
            variant={selectedPriceItemId === item.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectPriceItem(item.id)}
            className="h-6 px-2 text-[11px]"
          >
            {bestLabel}
            {snapshot.bestStore ? ` · ${snapshot.bestStore}` : ''}
          </Button>
        );
      }

      return (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onSelectPriceItem(item.id)}
          className="h-6 px-2 text-[11px]"
        >
          Ver precios
        </Button>
      );
    },
    [pricingByItemId, onSelectPriceItem, onRefreshItemPrice, selectedPriceItemId]
  );

  const categoryLookup = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const label = item.category_id ? categoryLookup.get(item.category_id) ?? item.category_label ?? 'Sin categoría' : item.category_label ?? null;
      return {
        ...item,
        category_label: label,
      };
    });
  }, [items, categoryLookup]);

  const pendingItems = useMemo(
    () => normalizedItems.filter((item) => !item.is_purchased),
    [normalizedItems]
  );

  const purchasedItems = useMemo(
    () => normalizedItems.filter((item) => item.is_purchased),
    [normalizedItems]
  );

  const orderedPendingItems = useMemo(() => {
    const idToItem = new Map(pendingItems.map((item) => [item.id, item]));
    const ordered: ShoppingListUIItem[] = [];
    manualOrder.forEach((id) => {
      const item = idToItem.get(id);
      if (item) {
        ordered.push(item);
        idToItem.delete(id);
      }
    });

    if (idToItem.size > 0) {
      const remainder = Array.from(idToItem.values()).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
      ordered.push(...remainder);
    }

    return ordered;
  }, [pendingItems, manualOrder]);

  const baseOrderedItems = useMemo(
    () => [...orderedPendingItems, ...purchasedItems],
    [orderedPendingItems, purchasedItems]
  );

  const filteredItems = useMemo(
    () => filterShoppingListItems(baseOrderedItems, filters),
    [baseOrderedItems, filters],
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, { label: string; items: ShoppingListUIItem[] }>();
    filteredItems.forEach((item) => {
      const key = item.category_id ?? UNCATEGORIZED_KEY;
      const label = item.category_id ? categoryLookup.get(item.category_id) ?? 'Otros' : 'Sin categoría';
      if (!groups.has(key)) {
        groups.set(key, { label, items: [] });
      }
      groups.get(key)!.items.push(item);
    });
    return Array.from(groups.entries()).map(([key, value]) => ({ id: key, ...value }));
  }, [filteredItems, categoryLookup]);

  // Reordenamiento eliminado por simplicidad
  const isReorderEnabled = false;

  const resetAddItemForm = () => {
    setItemName('');
    setItemQuantity('');
    setItemUnit('');
  };

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = itemName.trim();
    if (!trimmedName) {
      notifyError('Ingresá un nombre para el ítem.');
      return;
    }

    const quantityValue = itemQuantity.trim() ? Number(itemQuantity) : null;
    if (quantityValue !== null && Number.isNaN(quantityValue)) {
      notifyError('Ingresá una cantidad válida.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      await onAddItem({
        name: trimmedName,
        quantity: quantityValue,
        unit: itemUnit ? itemUnit : null,
      });
      resetAddItemForm();
    } catch (submitError) {
      console.error('Error al añadir ítem manualmente:', submitError);
      notifyError('No pudimos añadir el ítem. Inténtalo de nuevo.');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Función placeholder para mantener compatibilidad
  const handleManualOrderChange = (orderedIds: string[]) => {
    // Ordenamiento manual eliminado por ahora
    console.log('Ordenamiento manual no disponible', orderedIds);
  };

  const handleClearPurchased = async () => {
    setIsClearingPurchased(true);
    try {
      const success = await onClearPurchased();
      if (success) {
        notifySuccess('Limpiamos los ítems marcados como comprados.');
      } else {
        notifyError('No pudimos limpiar los ítems marcados como comprados.');
      }
    } catch (error) {
      console.error('Error al limpiar ítems comprados:', error);
      notifyError('Tuvimos un problema al limpiar los ítems marcados como comprados.');
    } finally {
      setIsClearingPurchased(false);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      const success = await onClearAll();
      if (success) {
        notifySuccess('Vaciamos tu lista.');
      } else {
        notifyError('No pudimos vaciar la lista.');
      }
    } catch (error) {
      console.error('Error al vaciar la lista:', error);
      notifyError('Tuvimos un problema al vaciar la lista.');
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleDeleteSingleItem = async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      const result = await onDeleteItem(itemId);
      if (result) {
        notifySuccess('Eliminamos el ítem de la lista.');
      }
    } catch (error) {
      console.error('Error al eliminar ítem de la lista:', error);
      notifyError('No pudimos eliminar el ítem.');
    } finally {
      setDeletingItemId((current) => (current === itemId ? null : current));
    }
  };

  const handleSearchAllPrices = async () => {
    try {
      await onSearchAllPrices();
    } catch (searchError) {
      console.error('Error al buscar precios masivamente:', searchError);
      notifyError('Tuvimos un problema al buscar precios.');
    }
  };

  if (isLoading && items.length === 0) {
    return <ShoppingListContentSkeleton />;
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
      <p className="text-sm">Generá una lista desde tu plan semanal o añadí ítems manualmente.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      <form onSubmit={handleAddItem} className="grid gap-3 md:grid-cols-4 md:items-end">
        <div className="md:col-span-2">
          <Label htmlFor="shopping-item-name">Ítem</Label>
          <Input
            id="shopping-item-name"
            ref={addItemInputRef}
            placeholder="Ej. Tomates perita"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="shopping-item-quantity">Cantidad</Label>
          <Input
            id="shopping-item-quantity"
            placeholder="Ej. 2"
            value={itemQuantity}
            onChange={(event) => setItemQuantity(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="shopping-item-unit">Unidad</Label>
          <Input
            id="shopping-item-unit"
            placeholder="Kg, Unidades..."
            value={itemUnit}
            onChange={(event) => setItemUnit(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <Button type="submit" disabled={isSubmittingItem}>
            {isSubmittingItem ? <Spinner size="sm" className="mr-2" /> : null}
            Añadir a la lista
          </Button>
        </div>
      </form>

      <PriceResultsPanel results={priceResults} itemName={itemForPriceSearch} isLoading={isSearchingPrices} />

      <Card className="flex flex-col flex-1">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Lista {generatedRange ? formatRange(generatedRange) : ''}</CardTitle>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
            <Button onClick={onGenerateList} disabled={isLoading} size="sm">
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <ListChecks className="h-4 w-4 mr-2" />}
              Generar lista
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-0">
          <div className="flex flex-col gap-3 border-b p-4 bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filtros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={viewMode === 'flat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(userId ?? null, 'flat')}
                >
                  <LayoutList className="h-4 w-4 mr-1" /> Lista
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'grouped' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(userId ?? null, 'grouped')}
                >
                  <LayoutGrid className="h-4 w-4 mr-1" /> Categorías
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(180px,1fr)_auto] items-center">
              <div className="flex items-center gap-2">
                <Input
                  ref={searchInputRef}
                  value={filters.searchTerm}
                  onChange={(event) => setFilters(userId ?? null, { searchTerm: event.target.value })}
                  placeholder="Buscar en la lista..."
                  className="pl-9"
                />
                <Search className="h-4 w-4 text-muted-foreground -ml-8" />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={filters.categoryId ?? 'all'}
                  onValueChange={(value) =>
                    setFilters(userId ?? null, {
                      categoryId: value === 'all' ? null : value,
                    })
                  }
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value={UNCATEGORIZED_KEY}>Sin categoría</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-purchased"
                  checked={filters.showPurchased}
                  onCheckedChange={(checked) => setFilters(userId ?? null, { showPurchased: checked })}
                />
                <Label htmlFor="show-purchased" className="text-sm">Ver ítems comprados</Label>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="flex h-full items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Spinner />
                </motion.div>
              ) : viewMode === 'grouped' ? (
                <motion.div
                  key="grouped"
                  className="h-full overflow-y-auto"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  {groupedItems.length === 0 ? (
                    emptyState
                  ) : (
                    <div className="space-y-4 p-4">
                      {groupedItems.map((group) => (
                        <Card key={group.id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-semibold">{group.label}</CardTitle>
                              <Badge variant="secondary">{group.items.length}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex-1 flex flex-col gap-1">
                                    <p className={`text-sm font-medium ${item.is_purchased ? 'text-muted-foreground line-through' : ''}`}>
                                      {item.name}
                                    </p>
                                    {(item.quantity !== null || item.unit) && (
                                      <p className="text-xs text-muted-foreground">
                                        {`${item.quantity ?? ''} ${item.unit ?? ''}`.trim()}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      {renderPriceBadge(item)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={item.is_purchased}
                                      onCheckedChange={() => onToggleItem(item.id, item.is_purchased)}
                                      aria-label={`Marcar ${item.name}`}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteSingleItem(item.id)}
                                      aria-label={`Eliminar ${item.name}`}
                                      disabled={deletingItemId === item.id}
                                    >
                                      {deletingItemId === item.id ? (
                                        <Spinner size="sm" className="text-muted-foreground" />
                                      ) : (
                                        <XCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="flat"
                  className="h-full"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <VirtualizedShoppingList
                    items={filteredItems}
                    onToggleItem={onToggleItem}
                    onDeleteItem={handleDeleteSingleItem}
                    onShowPriceDetails={onSelectPriceItem}
                    onRefreshItemPrice={(itemId) => {
                      void onRefreshItemPrice(itemId);
                    }}
                    pricingByItemId={pricingByItemId}
                    selectedPriceItemId={selectedPriceItemId}
                    emptyState={emptyState}
                    deletingItemId={deletingItemId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Atajos: ⌘/Ctrl + K buscar · ⌘/Ctrl + N nuevo ítem</span>
            <span className="hidden md:inline" aria-hidden="true">·</span>
            <span>{lastRefreshLabel}</span>
          </div>
          {filteredItems.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSearchAllPrices}
                disabled={isSearchingPrices}
              >
                {isSearchingPrices ? <Spinner size="sm" className="mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Buscar precios
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPurchased}
                disabled={isClearingPurchased}
              >
                {isClearingPurchased ? <Spinner size="sm" className="mr-2" /> : <ListChecks className="h-4 w-4 mr-2" />}
                Limpiar comprados
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={isClearingAll}
              >
                {isClearingAll ? <Spinner size="sm" className="mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Vaciar lista
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ShoppingListContent;
