import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { ListChecks, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner'; 
import { AddItemForm } from '@/features/shopping-list/components/AddItemForm'; 
import { useShoppingListStore } from '@/stores/shoppingListStore'; 
import { toast } from 'sonner'; 
import { motion } from 'framer-motion'; 

interface ShoppingListWidgetProps { 
  itemCount: number; 
  isLoading: boolean;
  error: string | null;
}

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

export function ShoppingListWidget({ itemCount, isLoading, error }: ShoppingListWidgetProps) { 
  const { addItem } = useShoppingListStore();

  const handleAddItem = async (itemName: string) => {
    const success = await addItem({ name: itemName });
    if (success) {
      toast.success(`"${itemName}" añadido a la lista.`);
    } else {
      toast.error(`Error al añadir "${itemName}".`);
    }
    if (!success) throw new Error("Failed to add item via store"); 
  };

  return (
    <Card className="h-full flex flex-col"> 
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-medium flex items-center gap-2"> 
          <ListChecks className="h-4 w-4 text-muted-foreground" /> 
          Lista de Compras
        </CardTitle>
        {/* Añadir motion a Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" className="h-7 -my-1 -mr-2 text-xs" asChild> 
            <Link to="/app/shopping-list">
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
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            className="h-full" 
          >
            {error ? (
              <p className="text-sm text-destructive text-center py-4">{error}</p>
            ) : (
              <div className="flex items-center gap-2 pt-2"> 
                <p className="text-sm text-foreground">
                  Tienes <span className="font-semibold text-lg">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'} en tu lista.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
      <CardFooter className="p-2 border-t border-border/20">
         <AddItemForm onAddItem={handleAddItem} />
      </CardFooter>
    </Card>
  );
}