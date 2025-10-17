import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { ListChecks, Search, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import type { ShoppingListUIItem } from '@/stores/shoppingListStore';

interface ShoppingListContentProps {
  items: ShoppingListUIItem[];
  isLoading: boolean;
  error: string | null;
  onToggleItem: (itemId: string, currentStatus: boolean) => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  onAddItem: (parsedItem: { name: string; quantity: number | null; unit: string | null }) => Promise<void>;
  onGenerateList: () => Promise<void>;
}

export const ShoppingListContentSimple: React.FC<ShoppingListContentProps> = ({
  items,
  isLoading,
  error,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onGenerateList,
}) => {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const pendingItems = items.filter((item) => !item.is_purchased);
  const purchasedItems = items.filter((item) => item.is_purchased);

  const resetAddItemForm = () => {
    setItemName('');
    setItemQuantity('');
    setItemUnit('');
  };

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      alert('Debes iniciar sesión para añadir items a la lista de compras');
      return;
    }

    const trimmedName = itemName.trim();
    if (!trimmedName) return;

    const quantityValue = itemQuantity.trim() ? Number(itemQuantity) : null;
    if (quantityValue !== null && Number.isNaN(quantityValue)) return;

    setIsSubmittingItem(true);
    try {
      await onAddItem({
        name: trimmedName,
        quantity: quantityValue,
        unit: itemUnit ? itemUnit : null,
      });
      resetAddItemForm();
    } catch (error) {
      console.error('Error al añadir ítem:', error);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      await onDeleteItem(itemId);
    } catch (error) {
      console.error('Error al eliminar ítem:', error);
    } finally {
      setDeletingItemId(null);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario para añadir ítems */}
      <Card>
        <CardHeader>
          <CardTitle>Añadir ítem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label htmlFor="item-name">Nombre</Label>
              <Input
                id="item-name"
                placeholder="Ej. Tomates"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="item-quantity">Cantidad</Label>
              <Input
                id="item-quantity"
                placeholder="2"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="item-unit">Unidad</Label>
              <Input
                id="item-unit"
                placeholder="Kg"
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={isSubmittingItem}>
                {isSubmittingItem ? <Spinner size="sm" className="mr-2" /> : null}
                Añadir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de compras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de compras</CardTitle>
            <Button onClick={onGenerateList} disabled={isLoading} size="sm">
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <ListChecks className="h-4 w-4 mr-2" />}
              Generar lista
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay ítems en la lista</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Ítems pendientes */}
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={item.is_purchased}
          onChange={() => onToggleItem(item.id, item.is_purchased)}
          className="w-4 h-4"
        />
        <div className="flex-1">
          <p className={`text-sm font-medium ${item.is_purchased ? 'line-through text-muted-foreground' : ''}`}>
            {item.name}
          </p>
          {(item.quantity !== null || item.unit) && (
            <p className="text-xs text-muted-foreground">
              {`${item.quantity ?? ''} ${item.unit ?? ''}`.trim()}
            </p>
          )}
        </div>
      </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deletingItemId === item.id}
                  >
                    {deletingItemId === item.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}

              {/* Ítems comprados */}
              {purchasedItems.length > 0 && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Comprados ({purchasedItems.length})
                    </h3>
                  </div>
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 border rounded-lg opacity-60"
                    >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.is_purchased}
                        onChange={() => onToggleItem(item.id, item.is_purchased)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-through text-muted-foreground">
                          {item.name}
                        </p>
                        {(item.quantity !== null || item.unit) && (
                          <p className="text-xs text-muted-foreground">
                            {`${item.quantity ?? ''} ${item.unit ?? ''}`.trim()}
                          </p>
                        )}
                      </div>
                    </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deletingItemId === item.id}
                      >
                        {deletingItemId === item.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
