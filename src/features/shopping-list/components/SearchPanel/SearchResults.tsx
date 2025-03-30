import React from 'react';
import { BuscaPreciosProduct } from '../../services/buscaPreciosService'; // Ajustar ruta si es necesario
import { Spinner } from '@/components/ui/Spinner';
import { ExternalLink } from 'lucide-react';

interface SearchResultsProps {
  results: BuscaPreciosProduct[] | null;
  isLoading: boolean;
  // TODO: Añadir prop para manejar selección de resultado (ej: onResultSelect)
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return <div className="p-4 text-center"><Spinner size="sm" /></div>;
  }

  if (!results || results.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">No se encontraron resultados.</p>;
  }

  const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

  return (
    <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] p-1"> {/* Ajustar max-h según sea necesario */}
      {results.map((product) => (
        <li 
          key={product.id} 
          className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
          // onClick={() => onResultSelect(product)} // TODO: Implementar selección
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <img 
              src={product.imagen || '/placeholder.svg'} 
              alt={product.nombre} 
              className="h-8 w-8 object-contain rounded-sm border flex-shrink-0"
              onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
            />
            <div className="overflow-hidden">
              <p className="text-xs font-medium leading-tight truncate" title={product.nombre}>{product.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{product.tienda}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
             <p className="text-xs font-semibold">{currencyFormatter.format(product.precio)}</p>
             {product.url && product.url !== '#' && (
                <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()} // Evitar que el click en el enlace active onResultSelect
                >
                    Ver <ExternalLink className="h-3 w-3" />
                </a>
             )}
          </div>
        </li>
      ))}
    </ul>
  );
}