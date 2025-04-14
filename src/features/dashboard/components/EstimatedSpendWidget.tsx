import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShoppingBag } from 'lucide-react';
// import { useShoppingListStore } from '../../../stores/shoppingListStore'; // <- Comentado temporalmente
import { motion } from 'framer-motion';

// --- Mock/Placeholder --- 
// TODO: Conectar con useShoppingListStore cuando el cálculo de costo esté disponible
// const estimatedCost = useShoppingListStore(state => state.PROPIEDAD_CORRECTA ?? 0);
// const isLoading = useShoppingListStore(state => state.isLoading);
// const error = useShoppingListStore(state => state.error);
const isLoading = false; // Mock
const error = null; // Mock
const estimatedCost = 0; // Mock
const dataAvailable = false; // Flag para indicar si hay datos reales (por ahora no)

export function EstimatedSpendWidget() {
  
  // Formatear el costo como moneda (ej. EUR)
  const formattedCost = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR', 
  }).format(estimatedCost);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 text-primary" />
          Gasto Estimado (Lista)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/2 mx-auto" /> {/* Centrar skeleton */}
            <Skeleton className="h-4 w-1/3 mx-auto" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : dataAvailable ? ( // Mostrar datos solo si están disponibles
          <div className="text-center"> 
            <p className="text-3xl font-bold text-foreground mb-1">{formattedCost}</p>
            <p className="text-xs text-muted-foreground">Valor aproximado</p>
          </div>
        ) : ( // Mensaje Placeholder si no hay datos
          <div className="text-center">
             <p className="text-sm text-muted-foreground">Cálculo de costo no disponible</p>
             {/* O podríamos mostrar $0.00 si se prefiere 
             <p className="text-3xl font-bold text-muted-foreground mb-1">{formattedCost}</p>
             <p className="text-xs text-muted-foreground">Valor aproximado</p> 
             */}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 