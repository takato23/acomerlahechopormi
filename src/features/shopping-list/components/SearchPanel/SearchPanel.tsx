import React, { useState, useCallback, useMemo } from 'react'; // Importar useMemo
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { searchProducts, BuscaPreciosProduct, SearchProductsResult } from '../../services/buscaPreciosService'; // Importar nuevo tipo
import { SearchTermRecord } from '@/lib/suggestions/types'; // Importar tipo de sugerencia
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select
import { Label } from '@/components/ui/label'; // Importar Label
import { Category } from '@/features/pantry/types'; // Corregir ruta de importación para Category

interface SearchPanelProps {
  categories: Category[];
  // onItemAdded?: () => void; // Eliminado - SearchPanel solo busca, no añade
}

export function SearchPanel({ categories }: SearchPanelProps) { // Quitado onItemAdded
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<BuscaPreciosProduct[] | null>(null); // Mantiene solo resultados exitosos
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Mensaje de error para mostrar
  const [fallbackSuggestions, setFallbackSuggestions] = useState<SearchTermRecord[]>([]); // Para sugerencias de fallback
  const [lastQuery, setLastQuery] = useState<string>(''); // Para el botón reintentar
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all'); // Estado para filtro, 'all' por defecto

  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce

  const handleSearch = useCallback(async (query: string, isRetry = false) => {
    const trimmedQuery = query.trim();
    setLastQuery(trimmedQuery); // Guardar siempre la última consulta intentada
    setFallbackSuggestions([]); // Limpiar fallbacks anteriores al iniciar búsqueda

    if (!trimmedQuery) {
      setResults(null);
      setError(null);
      setIsLoading(false); // Asegurarse de que no quede cargando
      return;
    }

    setIsLoading(true);
    setError(null);

    // Llamar a la función de servicio actualizada
    const searchResult: SearchProductsResult = await searchProducts(trimmedQuery, isRetry);

    if (!searchResult.error) {
      // Éxito
      setResults(searchResult.products);
      setError(null);
      setFallbackSuggestions([]);
    } else {
      // Error con fallback
      console.error("Error searching products (fallback triggered):", searchResult.originalError);
      setError(`Error al buscar "${trimmedQuery}". Intenta con estas sugerencias o reintenta.`);
      setResults(null); // Limpiar resultados anteriores en caso de error
      setFallbackSuggestions(searchResult.fallbackSuggestions);
    }

    setIsLoading(false);
  }, []);

  const retrySearch = useCallback(() => {
      if (lastQuery) {
          console.log("Retrying search for:", lastQuery);
          handleSearch(lastQuery, true); // Llama marcando como reintento
      }
  }, [lastQuery, handleSearch]);

  // Efecto para buscar cuando el término debounced cambia
  React.useEffect(() => {
    // Solo buscar si el término debounced no está vacío
    if (debouncedSearchTerm) {
        handleSearch(debouncedSearchTerm);
    } else {
        // Limpiar resultados si el input se vacía
        setResults(null);
        setError(null);
        setFallbackSuggestions([]);
        setIsLoading(false);
    }
  }, [debouncedSearchTerm, handleSearch]);

  // TODO: Implementar onResultSelect para interactuar con el mapa/lista
  // const handleResultSelect = (product: BuscaPreciosProduct) => { ... }

  // Filtrar resultados (simulado por ahora, ya que no tenemos categoría en los resultados)
  const filteredResults = useMemo(() => {
    if (!results || selectedCategoryId === 'all') {
      return results;
    }
    // Lógica de filtrado real iría aquí si tuviéramos la categoría en 'results'
    // Por ahora, devolvemos todos los resultados independientemente del filtro
    console.warn("Filtrado por categoría aún no implementado en los resultados de BuscaPrecios.");
    return results;
  }, [results, selectedCategoryId]);

  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Buscar Precios</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow p-4 space-y-4 overflow-hidden">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          isLoading={isLoading}
        />
       {/* Filtro de Categoría */}
       <div className="space-y-1">
          <Label htmlFor="category-filter" className="text-xs">Filtrar por Categoría:</Label>
          <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={isLoading}
          >
              <SelectTrigger id="category-filter" className="h-9 text-xs">
                  <SelectValue placeholder="Categoría..." />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs">
                          {cat.name}
                      </SelectItem>
                  ))}
              </SelectContent>
          </Select>
       </div>
        {/* Mostrar Error y Sugerencias de Fallback */}
        {error && (
            <div className="text-center text-sm text-destructive p-2 border border-destructive/50 rounded-md">
                <p>{error}</p>
                {fallbackSuggestions.length > 0 && (
                    <div className="mt-2">
                        <p className="text-muted-foreground text-xs mb-1">Sugerencias:</p>
                        <ul className="flex flex-wrap gap-1 justify-center">
                            {fallbackSuggestions.map((s) => (
                                <li key={s.term}>
                                    <button
                                        onClick={() => setSearchTerm(s.term)} // Poner término en input para nueva búsqueda
                                        className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-0.5 rounded"
                                    >
                                        {s.term}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {/* Botón Reintentar */}
                <button
                    onClick={retrySearch}
                    disabled={isLoading || !lastQuery}
                    className="mt-2 text-xs text-primary hover:underline disabled:opacity-50"
                >
                    Reintentar última búsqueda
                </button>
            </div>
        )}
        {/* Contenedor para scroll de resultados (solo si no hay error con fallbacks) */}
        {!error && (
             <div className="flex-grow overflow-y-auto">
               <SearchResults
                 results={filteredResults} // Pasamos los resultados filtrados (solo productos)
                 isLoading={isLoading}
                 // onResultSelect={handleResultSelect}
               />
             </div>
        )}
      {/* La línea 169 (</div> extra) se elimina */}
      </CardContent>
    </Card>
  );
}