import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner'; 
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
  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl card-pastel dark:card-pastel-dark border border-white/50 dark:border-white/10 shadow-card-pastel">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 via-white/40 to-secondary/10 dark:from-secondary/20 dark:via-background/40 dark:to-background/20" aria-hidden="true" />
      <CardHeader className="relative z-10 flex flex-row items-center justify-between gap-3 px-6 pt-6 pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl tint-secondary shadow-pill">
            <ListChecks className="h-5 w-5" />
          </span>
          Lista de compras
        </CardTitle>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
            <Link to="/app/shopping-list">
              Ver lista <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col justify-center px-6 pb-6 pt-0">
        {isLoading ? (
          <div className="flex min-h-[140px] items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={contentVariants}
            className="space-y-3"
          >
            {error ? (
              <p className="rounded-2xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-center text-sm text-destructive shadow-custom-sm">{error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Prepará tu próxima compra en base a tu plan semanal.
                </p>
                <div className="inline-flex items-baseline gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-primary shadow-custom-sm">
                  <span className="text-2xl font-semibold">{itemCount}</span>
                  <span className="text-xs uppercase tracking-[0.28em] text-primary/80">
                    {itemCount === 1 ? 'item activo' : 'items activos'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
