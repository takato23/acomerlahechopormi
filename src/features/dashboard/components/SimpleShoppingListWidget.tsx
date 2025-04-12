import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { ListChecks, ArrowRight, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner'; 
import { useSimpleShoppingStore } from '@/features/shopping-list/simpleShoppingStore';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function SimpleShoppingListWidget() {
  const { items, isLoading, error, fetchItems, addItem } = useSimpleShoppingStore();
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Cargar elementos al montar el componente
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) return;
    
    setIsAdding(true);
    
    try {
      const result = await addItem(newItemName);
      
      if (result) {
        toast.success(`"${newItemName}" añadido a la lista.`);
        setNewItemName('');
      } else {
        toast.error('No se pudo añadir el ítem.');
      }
    } catch (error) {
      console.error('Error al añadir ítem:', error);
      toast.error('Error al añadir el ítem.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" /> 
          Lista de Compras Simple
        </CardTitle>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" className="h-7 -my-1 -mr-2 text-sm" asChild>
            <Link to="/app/simple-shopping">
              Ver Lista <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow"> 
        {isLoading ? (
          <div className="flex items-center justify-center h-full"> 
             <Spinner size="sm" /> 
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full" 
          >
            {error ? (
              <p className="text-sm text-destructive text-center py-4">{error}</p>
            ) : (
              <div className="flex items-center gap-2 pt-2"> 
                <p className="text-sm text-slate-700">
                  Tienes <span className="font-semibold text-lg text-slate-900">{items.length}</span> {items.length === 1 ? 'ítem' : 'ítems'} en tu lista.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
      <CardFooter className="p-2 border-t border-slate-200">
        <form onSubmit={handleAddItem} className="flex w-full gap-2">
          <Input
            type="text"
            placeholder="Añadir ítem..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="flex-1"
            disabled={isAdding}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isAdding || !newItemName.trim()}
          >
            {isAdding ? <Spinner size="sm" /> : <Plus className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
} 