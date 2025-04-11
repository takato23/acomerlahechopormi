import React from 'react';
import { BuscaPreciosProduct } from '../services/buscaPreciosService'; // Asumiendo que este tipo existe
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface PriceResultsDisplayProps {
  results: BuscaPreciosProduct[] | null;
  itemName: string | null;
  isLoading: boolean;
}

export function PriceResultsDisplay({ results, itemName, isLoading }: PriceResultsDisplayProps) {
  if (isLoading) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-muted/20 text-center">
        <Spinner size="sm" className="inline-block mr-2" />
        Buscando precios para "{itemName}"...
      </div>
    );
  }

  if (!results || results.length === 0) {
    // No mostrar nada si no hay resultados o no se ha buscado
    // O mostrar un mensaje si results es un array vacío después de buscar
    if (Array.isArray(results) && itemName) {
         return (
             <div className="mt-4 p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground">
                 No se encontraron precios online para "{itemName}".
             </div>
         );
    }
    return null; 
  }

  // Formateador de moneda (ejemplo ARS)
  const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  });

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Precios encontrados para "{itemName}"</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {results.map((product, index) => (
            <li key={`${product.tienda}-${product.id}-${product.nombre}-${product.precio}-${index}`} className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <img 
                  src={product.imagen || '/placeholder.svg'} 
                  alt={product.nombre} 
                  className="h-10 w-10 object-contain rounded-sm border" 
                  onError={(e) => (e.currentTarget.src = '/placeholder.svg')} // Fallback
                />
                <div>
                  <p className="text-sm font-medium leading-tight">{product.nombre}</p>
                  <p className="text-xs text-muted-foreground">{product.tienda}</p>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-sm font-semibold">{currencyFormatter.format(product.precio)}</p>
                 {product.url && product.url !== '#' && (
                    <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                        Ver
                        <ExternalLink className="h-3 w-3" />
                    </a>
                 )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}