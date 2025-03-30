import React, { useState, useEffect } from 'react';
import { AddPantryItemForm } from './AddPantryItemForm';
import { PantryList } from './PantryList';
import { usePantryStore } from '@/stores/pantryStore'; 
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'sonner'; // Importar toast para feedback
// Usar any temporalmente
// import type { PantryItem, NewPantryItem, UpdatePantryItem } from './types';
type PantryItem = any;
type NewPantryItem = any;
type UpdatePantryItem = any;


export function PantryPage() {
  const { 
    items, 
    isLoading, 
    error, 
    fetchItems, 
    addItem, 
    updateItem, 
    deleteItem 
  } = usePantryStore();

  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  // Estado para feedback de acciones (opcional, Zustand ya tiene isLoading)
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Guarda el ID del item procesándose

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSaveItem = async (itemData: NewPantryItem | UpdatePantryItem, id?: string) => {
    setIsProcessing(id || 'new'); // Marcar como procesando
    let success = false;
    let action: 'añadido' | 'actualizado' = 'añadido';
    try {
      if (id) {
        action = 'actualizado';
        const updatedItem = await updateItem(id, itemData as UpdatePantryItem);
        success = !!updatedItem;
      } else {
        action = 'añadido';
        const newItem = await addItem(itemData as NewPantryItem);
        success = !!newItem;
      }
      if (success) {
        toast.success(`Ítem ${action} con éxito.`);
        setEditingItem(null); 
      } else {
        toast.error(`Error al ${action === 'añadido' ? 'añadir' : 'actualizar'} el ítem.`);
      }
    } catch (err) {
       toast.error(`Error inesperado al ${action === 'añadido' ? 'añadir' : 'actualizar'} el ítem.`);
       console.error("Save item error:", err);
    } finally {
       setIsProcessing(null); // Limpiar estado de procesamiento
    }
    return success; 
  };

  const handleDeleteItem = async (id: string) => {
    setIsProcessing(id);
    const itemName = items.find(i => i.id === id)?.name || 'el ítem'; // Nombre para el toast
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar "${itemName}"?`);
    if (!confirmDelete) {
       setIsProcessing(null);
       return; 
    }
    
    const success = await deleteItem(id);
    if (success) {
       toast.success(`"${itemName}" eliminado con éxito.`);
    } else {
       toast.error(`Error al eliminar "${itemName}".`);
    }
     setIsProcessing(null);
  };
  
  // Nuevo handler para cambios de cantidad desde PantryList
  const handleQuantityChange = async (item: PantryItem, delta: number) => {
     const currentQuantity = item.quantity ?? 0;
     const newQuantity = Math.max(0, currentQuantity + delta);
     if (newQuantity === item.quantity) return; 

     setIsProcessing(item.id); // Marcar como procesando
     try {
        const success = await updateItem(item.id, { quantity: newQuantity });
        if (!success) {
           toast.error(`Error al actualizar cantidad de "${item.name}".`);
           // Zustand revierte el estado si falla, no necesitamos revertir aquí
        }
     } catch (err) {
        toast.error(`Error inesperado al actualizar cantidad.`);
        console.error("Update quantity error:", err);
     } finally {
        setIsProcessing(null);
     }
  };

  const handleEditItem = (item: PantryItem) => {
    setEditingItem(item);
     document.getElementById('pantry-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Mi Despensa</h1>

      <div id="pantry-form"> 
        <AddPantryItemForm 
          onSave={handleSaveItem} 
          itemToEdit={editingItem}
          onCancel={handleCancelEdit} 
          // onError ya no es necesaria aquí, se maneja con toasts
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-destructive text-center">{error}</p>
      ) : (
        <PantryList 
          items={items} 
          onEditClick={handleEditItem} // Pasar la función correcta para iniciar edición
          onDeleteClick={handleDeleteItem} // Pasar la función correcta para eliminar
          onQuantityChange={handleQuantityChange} // Pasar la función correcta para cantidad
          // Opcional: Podríamos pasar una función para saber si un item se está procesando
          // isProcessing={(itemId) => isProcessing === itemId} 
        />
      )}
    </div>
  );
}