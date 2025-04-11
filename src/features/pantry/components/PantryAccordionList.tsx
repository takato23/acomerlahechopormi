import { useState, useMemo, useEffect } from 'react';
import { PantryItem } from '@/types/pantryTypes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Star, Calendar } from 'lucide-react';
import { Category } from '@/types/categoryTypes';
// Usar la importación centralizada
import { getCategories } from '@/features/categories';
import { updatePantryItem, deletePantryItem } from '../services/pantryService';
import { usePantryStore } from '../stores/pantryStore';
import { formatDate } from '@/lib/utils';

interface Props {
  items: PantryItem[];
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

export const PantryAccordionList = ({ items, onEdit, onDelete, onToggleFavorite }: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number | string>('');
  const [editingUnit, setEditingUnit] = useState<string>('');
  const [editingExpiry, setEditingExpiry] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { updateItem, deleteItem } = usePantryStore();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: PantryItem[] } = {};
    items.forEach(item => {
      const categoryName = item.category?.name || 'Sin categoría';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(item);
    });
    return Object.entries(groups).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
  }, [items]);

  const handleEditClick = (item: PantryItem) => {
    setEditingItemId(item.id);
    setEditingQuantity(item.quantity ?? '');
    setEditingUnit(item.unit ?? '');
    setEditingExpiry(item.expiry_date ? item.expiry_date.split('T')[0] : '');
    setEditingNotes(item.notes ?? '');
  };

  const handleSaveEdit = async (itemId: string) => {
    try {
      await updateItem(itemId, {
        quantity: typeof editingQuantity === 'string' ? parseFloat(editingQuantity) : editingQuantity,
        unit: editingUnit || null,
        expiry_date: editingExpiry || null,
        notes: editingNotes || null,
      });
      setEditingItemId(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedItems);
    try {
      await Promise.all(idsToDelete.map(id => deleteItem(id)));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error deleting selected items:', error);
    }
  };

  return (
    <div className="space-y-4">
      {selectedItems.size > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="destructive" onClick={handleDeleteSelected}>
            Eliminar Seleccionados ({selectedItems.size})
          </Button>
        </div>
      )}
      <Accordion type="multiple" className="w-full">
        {groupedItems.map(([categoryName, categoryItems]) => (
          <AccordionItem key={categoryName} value={categoryName}>
            <AccordionTrigger className="text-lg font-medium">{categoryName}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-3">
                {categoryItems.map((item) => (
                  <li key={item.id} className="flex items-center space-x-3 p-2 border-b">
                    <Checkbox
                      id={`select-${item.id}`}
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      {editingItemId === item.id ? (
                        <div className="space-y-2">
                          <p className="font-medium">{item.ingredient?.name}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`quantity-${item.id}`}>Cantidad</Label>
                              <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`unit-${item.id}`}>Unidad</Label>
                              <Input
                                id={`unit-${item.id}`}
                                type="text"
                                value={editingUnit}
                                onChange={(e) => setEditingUnit(e.target.value)}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`expiry-${item.id}`}>Vencimiento</Label>
                            <Input
                              id={`expiry-${item.id}`}
                              type="date"
                              value={editingExpiry}
                              onChange={(e) => setEditingExpiry(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`notes-${item.id}`}>Notas</Label>
                            <Input
                              id={`notes-${item.id}`}
                              type="text"
                              value={editingNotes}
                              onChange={(e) => setEditingNotes(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-2">
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancelar</Button>
                            <Button size="sm" onClick={() => handleSaveEdit(item.id)}>Guardar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.ingredient?.name}</span>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleFavorite(item.id, !item.is_favorite)}>
                                <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(item)}>
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <span>{item.quantity} {item.unit}</span>
                            {item.expiry_date && (
                              <span className="flex items-center text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                Vence: {formatDate(item.expiry_date)}
                              </span>
                            )}
                          </div>
                          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};