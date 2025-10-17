import { useEffect, useState } from 'react';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { onboardingCopy } from '../../copy';
import type { PantryDraftItem } from '../../types';
import UnifiedPantryInput from '@/features/pantry/components/UnifiedPantryInput';
import type { CreatePantryItemData } from '@/features/pantry/types';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

interface InitialInventoryStepProps {
  items: PantryDraftItem[];
  onAddItem: (item: PantryDraftItem) => void;
  onRemoveItem: (id: string) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function InitialInventoryStep({
  items,
  onAddItem,
  onRemoveItem,
  onComplete,
  onBack,
  isSubmitting
}: InitialInventoryStepProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      setIsLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('order', { ascending: true });

      if (!isMounted) return;
      if (error) {
        console.error('[InitialInventoryStep] Error loading categories', error);
        setCategories([]);
      } else if (data) {
        setCategories(
          data.map((category) => ({
            id: category.id,
            name: category.name
          }))
        );
      }
      setIsLoadingCategories(false);
    }

    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateItem = async (itemData: CreatePantryItemData) => {
    const draftItem: PantryDraftItem = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      ingredient_name: itemData.ingredient_name,
      quantity: itemData.quantity ?? null,
      unit: itemData.unit ?? null,
      category_id: itemData.category_id ?? null,
      notes: itemData.notes ?? null
    };
    onAddItem(draftItem);
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{onboardingCopy.inventoryHelper}</p>

      <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-4">
        <UnifiedPantryInput
          onItemAdded={() => void 0}
          availableCategories={categories}
          onCreateItem={handleCreateItem}
        />
        {isLoadingCategories ? (
          <p className="mt-2 text-xs text-muted-foreground">Cargando categorías...</p>
        ) : null}
      </div>

      <div className={cn('space-y-3', items.length === 0 && 'border border-dashed border-border p-6 text-center')}>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Agrega ingredientes para tener un arranque personalizado.</p>
        ) : (
          <>
            <h3 className="text-sm font-medium text-muted-foreground">
              Ingredientes añadidos ({items.length})
            </h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md bg-card px-3 py-2 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-foreground">{item.ingredient_name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {item.quantity !== null ? <Badge variant="outline">{item.quantity}</Badge> : null}
                      {item.unit ? <Badge variant="outline">{item.unit}</Badge> : null}
                      {item.category_id ? <Badge variant="secondary">Categoría asignada</Badge> : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    aria-label={`Eliminar ${item.ingredient_name}`}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

  <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          {onboardingCopy.ctaBack}
        </Button>
        <Button type="button" disabled={isSubmitting} onClick={onComplete}>
          {isSubmitting ? 'Guardando...' : onboardingCopy.ctaNext}
        </Button>
      </div>
    </div>
  );
}
