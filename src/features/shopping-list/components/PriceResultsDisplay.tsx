import React, { useMemo, useEffect } from 'react';
import { BuscaPreciosProduct } from '../services/buscaPreciosService'; // Asumiendo que este tipo existe
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceResultsDisplayProps {
  results: BuscaPreciosProduct[] | null;
  itemName: string | null;
  isLoading: boolean;
  onStoreSelect?: (storeName: string | null) => void;
  storeFilter: string;
  onStoreFilterChange: (value: string) => void;
}

// Helper para agrupar productos por tienda
const groupProductsByStore = (products: BuscaPreciosProduct[]) => {
  return products.reduce((acc, product) => {
    const storeName = product.tienda || 'Tienda Desconocida';
    if (!acc[storeName]) {
      acc[storeName] = [];
    }
    acc[storeName].push(product);
    return acc;
  }, {} as Record<string, BuscaPreciosProduct[]>);
};

export function PriceResultsDisplay({
  results,
  itemName,
  isLoading,
  onStoreSelect,
  storeFilter,
  onStoreFilterChange,
}: PriceResultsDisplayProps) {
  
  // Agrupar resultados por tienda usando useMemo
  const groupedResults = useMemo(() => {
    if (!results) return null;
    return groupProductsByStore(results);
  }, [results]);

  // Obtener lista de tiendas únicas para el filtro
  const uniqueStoreNames = useMemo(() => {
    if (!groupedResults) return [];
    return Object.keys(groupedResults);
  }, [groupedResults]);

  // Filtrar los resultados agrupados basándose en el filtro seleccionado
  const filteredGroupedResults = useMemo(() => {
    if (!groupedResults) return null;
    if (storeFilter === 'all') {
      return groupedResults;
    }
    const filtered: Record<string, BuscaPreciosProduct[]> = {};
    if (groupedResults[storeFilter]) {
      filtered[storeFilter] = groupedResults[storeFilter];
    }
    return filtered;
  }, [groupedResults, storeFilter]);

  // ---> LOG PARA DEBUG
  useEffect(() => {
    if (groupedResults) {
      console.log('[PriceResultsDisplay] Unique store names:', uniqueStoreNames);
      console.log('[PriceResultsDisplay] Filtered results keys:', filteredGroupedResults ? Object.keys(filteredGroupedResults) : 'null');
    }
  }, [uniqueStoreNames, groupedResults, filteredGroupedResults]);
  // ---> FIN LOG

  if (isLoading) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-muted/20 text-center">
        <Spinner size="sm" className="inline-block mr-2" />
        Buscando precios para "{itemName}"...
      </div>
    );
  }

  if (!groupedResults || Object.keys(groupedResults).length === 0) {
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
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center mb-3">
          <CardTitle className="text-lg font-semibold">Precios encontrados para "{itemName}"</CardTitle>
          {uniqueStoreNames.length > 1 && (
            <Select value={storeFilter} onValueChange={onStoreFilterChange}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Filtrar tienda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tiendas</SelectItem>
                {uniqueStoreNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredGroupedResults && Object.keys(filteredGroupedResults).length === 0 && storeFilter !== 'all' ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay resultados para "{storeFilter}".
          </p>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {filteredGroupedResults && Object.entries(filteredGroupedResults).map(([storeName, products]) => {
              const minPrice = Math.min(...products.map(p => p.precio));
              
              return (
                <AccordionItem value={storeName} key={storeName} className="border rounded-md px-3">
                  <div onClick={() => onStoreSelect?.(storeName)} role="button" tabIndex={0} className="cursor-pointer" aria-label={`Seleccionar tienda ${storeName}`}>
                    <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
                      <div className="flex justify-between items-center w-full pr-2">
                        <span>{storeName} ({products.length})</span>
                        <span className="text-muted-foreground text-xs font-normal">Desde {currencyFormatter.format(minPrice)}</span>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="pt-1 pb-3">
                    <ul className="space-y-2">
                      {products.map((product, index) => (
                        <li key={`${product.tienda}-${product.id}-${product.nombre}-${product.precio}-${index}`} className="flex items-center justify-between p-2 rounded bg-muted/30">
                          <div className="flex items-center gap-2">
                            <img 
                              src={product.imagen || '/placeholder.svg'} 
                              alt={product.nombre} 
                              className="h-8 w-8 object-contain rounded-sm border" 
                              onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                            />
                            <div>
                              <p className="text-xs font-medium leading-tight">{product.nombre}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-xs font-semibold">{currencyFormatter.format(product.precio)}</p>
                            {product.url && product.url !== '#' && (
                              <a 
                                href={product.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                Ver
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}