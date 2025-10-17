import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBasket, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/common/EmptyState';
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
    <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 shadow-card-pastel">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-white/45 to-accent/10 dark:from-accent/20 dark:via-background/40 dark:to-background/20" aria-hidden="true" />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between gap-3 px-6 pt-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl tint-accent shadow-pill">
            <ShoppingBasket className="h-5 w-5" />
          </span>
          Despensa baja
        </CardTitle>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
            <Link to="/app/pantry">
              Ver despensa <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="relative z-10 flex-grow px-6 pb-6 pt-0">
        {isLoading ? (
          <div className="flex min-h-[140px] items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            className="flex h-full flex-col"
          >
            {error ? (
              <p className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-center text-sm text-destructive shadow-custom-sm">{error}</p>
            ) : itemCount > 0 ? (
              <div className="flex h-full flex-col space-y-3">
                <p className="text-sm text-muted-foreground">
                  Detectamos <span className="font-semibold text-destructive">{itemCount}</span> {itemCount === 1 ? 'ingrediente con riesgo' : 'ingredientes con riesgo'}.
                </p>
                <ul className="flex-grow space-y-1.5 overflow-y-auto pr-1 text-xs text-muted-foreground">
                  <AnimatePresence initial={false}>
                    {lowStockItems.slice(0, 7).map((item) => (
                      <motion.li
                        key={item.id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="flex items-center gap-1.5 rounded-lg bg-white/70 dark:bg-background/60 px-3 py-2 shadow-custom-sm"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="truncate">
                          {item.name} {item.quantity !== null ? `(${item.quantity} ${item.unit || ''})` : '(sin cantidad)'}
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {itemCount > 7 && (
                    <li className="text-center text-[11px] text-muted-foreground/70">…y {itemCount - 7} más</li>
                  )}
                </ul>
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="text-primary" />}
                title="¡Despensa surtida!"
                description="No hay ingredientes con stock bajo por ahora."
                className="h-full justify-center py-6"
              />
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
