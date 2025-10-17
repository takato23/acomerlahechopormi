import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { ShoppingListUIItem } from '@/stores/shoppingListStore';
import type { ItemPriceSnapshot } from '../hooks/useBuscapreciosPricing';

interface VirtualizedShoppingListProps {
  items: ShoppingListUIItem[];
  onToggleItem: (itemId: string, currentStatus: boolean) => void;
  onDeleteItem: (itemId: string) => Promise<void> | void;
  onShowPriceDetails: (itemId: string) => void;
  onRefreshItemPrice: (itemId: string) => void;
  pricingByItemId: Record<string, ItemPriceSnapshot>;
  selectedPriceItemId: string | null;
  emptyState?: React.ReactNode;
  listClassName?: string;
  deletingItemId?: string | null;
  onManualOrderChange?: (itemId: string, newOrder: number) => void;
  isReorderEnabled?: boolean;
}

interface VirtualizedRowProps {
  item: ShoppingListUIItem;
  virtualStart: number;
  virtualSize: number;
  onToggleItem: (itemId: string, currentStatus: boolean) => void;
  onDeleteItem: (itemId: string) => Promise<void> | void;
  onShowPriceDetails: (itemId: string) => void;
  onRefreshItemPrice: (itemId: string) => void;
  priceSnapshot: ItemPriceSnapshot | undefined;
  isSelected: boolean;
  isDeleting: boolean;
}

const ROW_ESTIMATED_SIZE = 68;

const VirtualizedRow: React.FC<VirtualizedRowProps> = ({
  item,
  virtualStart,
  virtualSize,
  onToggleItem,
  onDeleteItem,
  onShowPriceDetails,
  onRefreshItemPrice,
  priceSnapshot,
  isSelected,
  isDeleting,
}) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: `${virtualSize}px`,
    transform: `translateY(${virtualStart}px)`,
  };

  const categoryLabel = item.category_label || item.category_id || undefined;

  const getBestPriceLabel = () => {
    if (!priceSnapshot || priceSnapshot.bestPrice === null || priceSnapshot.bestPrice === undefined) {
      return null;
    }
    return `$${priceSnapshot.bestPrice.toFixed(2)}`;
  };

  const renderPriceBadge = () => {
    const bestPriceLabel = getBestPriceLabel();

    if (!priceSnapshot || priceSnapshot.status === 'idle') {
      return (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onShowPriceDetails(item.id)}
          className="h-6 px-2 text-[11px]"
        >
          Ver precios
        </Button>
      );
    }

    if (priceSnapshot.status === 'loading') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
          <Spinner size="sm" className="h-3 w-3" />
          Actualizando…
        </Badge>
      );
    }

    if (priceSnapshot.status === 'error') {
      return (
        <Button
          type="button"
          variant="link"
          size="xs"
          onClick={() => {
            onRefreshItemPrice(item.id);
          }}
          className="h-auto px-0 text-[11px] text-destructive"
        >
          Reintentar precios
        </Button>
      );
    }

    if (priceSnapshot.status === 'success' && bestPriceLabel) {
      return (
        <Button
          type="button"
          variant={isSelected ? 'default' : 'outline'}
          size="xs"
          onClick={() => onShowPriceDetails(item.id)}
          className="h-6 px-2 text-[11px]"
        >
          {bestPriceLabel}
          {priceSnapshot.bestStore ? ` · ${priceSnapshot.bestStore}` : ''}
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => onShowPriceDetails(item.id)}
        className="h-6 px-2 text-[11px]"
      >
        Ver precios
      </Button>
    );
  };

  return (
    <div style={style} data-id={item.id}>
      <div
        className={`flex items-center gap-3 p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors ${
          item.is_purchased ? 'opacity-70' : ''
        }`}
      >
        <Checkbox
          id={`item-${item.id}`}
          checked={item.is_purchased}
          onCheckedChange={() => onToggleItem(item.id, item.is_purchased)}
          aria-label={`Marcar ${item.name}`}
        />
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <label
            htmlFor={`item-${item.id}`}
            className={`text-sm font-medium cursor-pointer truncate ${
              item.is_purchased ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}
          >
            {item.name}
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {(item.quantity !== null || item.unit) && (
              <span className="text-xs">{`${item.quantity ?? ''} ${item.unit ?? ''}`.trim()}</span>
            )}
            {categoryLabel && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {categoryLabel}
              </Badge>
            )}
            {item.notes && <span className="truncate max-w-[200px]">{item.notes}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {renderPriceBadge()}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 text-muted-foreground hover:text-destructive h-8 w-8"
          disabled={isDeleting}
          onClick={() => onDeleteItem(item.id)}
          aria-label={`Eliminar ${item.name}`}
        >
          {isDeleting ? <Spinner size="sm" className="text-muted-foreground" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export const VirtualizedShoppingList: React.FC<VirtualizedShoppingListProps> = ({
  items,
  onToggleItem,
  onDeleteItem,
  onShowPriceDetails,
  onRefreshItemPrice,
  pricingByItemId,
  selectedPriceItemId,
  emptyState,
  listClassName,
  deletingItemId = null,
  onManualOrderChange,
  isReorderEnabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_ESTIMATED_SIZE,
    overscan: 8,
  });

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  if (!items.length) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-y-auto ${listClassName ?? ''}`}
    >
      <div style={{ height: `${totalSize}px`, position: 'relative', width: '100%' }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          return (
            <VirtualizedRow
              key={item.id}
              item={item}
              virtualStart={virtualItem.start}
              virtualSize={virtualItem.size}
              onToggleItem={onToggleItem}
              onDeleteItem={onDeleteItem}
              onShowPriceDetails={onShowPriceDetails}
              onRefreshItemPrice={onRefreshItemPrice}
              priceSnapshot={pricingByItemId[item.id]}
              isSelected={selectedPriceItemId === item.id}
              isDeleting={deletingItemId === item.id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedShoppingList;
