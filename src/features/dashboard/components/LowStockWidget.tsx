import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBasket, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'; // Añadir CheckCircle2
import { Spinner } from '@/components/ui/Spinner'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { EmptyState } from '@/components/common/EmptyState'; // Importar EmptyState
type PantryItem = any;

interface LowStockWidgetProps { 
  lowStockItems: PantryItem[];
  isLoading: boolean;
  error: string | null;
}

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const listItemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 } 
};

export function LowStockWidget({ lowStockItems, isLoading, error }: LowStockWidgetProps) { 
  const itemCount = lowStockItems.length;

  return (
    <Card className="h-full flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <ShoppingBasket className="h-4 w-4 text-muted-foreground" /> 
          Despensa Baja
        </CardTitle>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="sm" className="h-7 -my-1 -mr-2 text-sm" asChild>
            <Link to="/app/pantry">
              Ver Despensa <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow min-h-0"> 
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
            ) : itemCount > 0 ? (
              <div className="pt-2 h-full flex flex-col"> 
                <p className="text-sm text-slate-700 mb-2 flex-shrink-0">
                  Tienes <span className="font-semibold text-orange-600">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'} con stock bajo (≤1).
                </p>
                <ul className="space-y-1 overflow-y-auto flex-grow min-h-0 pr-1"> 
                  <AnimatePresence initial={false}> 
                    {lowStockItems.slice(0, 7).map((item) => ( 
                      <motion.li 
                        key={item.id} 
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout 
                        className="text-xs text-slate-600 flex items-center gap-1.5"
                      > 
                         <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0"/> 
                         <span className="truncate"> 
                            {item.name} {item.quantity !== null ? `(${item.quantity} ${item.unit || ''})` : '(Sin cantidad)'}
                         </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                   {itemCount > 7 && (
                     <li className="text-xs text-slate-500 text-center pt-1">...y {itemCount - 7} más</li>
                   )}
                </ul>
              </div>
            ) : (
               // Usar EmptyState
               <EmptyState
                 icon={<CheckCircle2 />}
                 title="¡Despensa surtida!"
                 description="No hay ítems con stock bajo."
                 className="h-full justify-center py-6" 
               />
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}