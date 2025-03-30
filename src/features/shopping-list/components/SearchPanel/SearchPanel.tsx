import React, { useState, useCallback, useMemo } from 'react'; // Importar useMemo
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { searchProducts, BuscaPreciosProduct } from '../../services/buscaPreciosService';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select
import { Label } from '@/components/ui/label'; // Importar Label
import { Category } from '@/features/pantry/types'; // Corregir ruta de importación para Category

interface SearchPanelProps {
  categories: Category[]; // Añadir prop para categorías
}

export function SearchPanel({ categories }: SearchPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<BuscaPreciosProduct[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all'); // Estado para filtro, 'all' por defecto

  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults(null);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const searchResults = await searchProducts(query);
      setResults(searchResults);
    } catch (err) {
      console.error("Error searching products:", err);
      setError("Error al buscar precios. Intenta de nuevo.");
      setResults([]); // Mostrar error pero permitir nueva búsqueda
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto para buscar cuando el término debounced cambia
  React.useEffect(() => {
    handleSearch(debouncedSearchTerm);
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
       {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <div className="flex-grow overflow-y-auto"> {/* Contenedor para scroll de resultados */}
          <SearchResults
            results={filteredResults} // Usar resultados filtrados
            isLoading={isLoading}
            // onResultSelect={handleResultSelect}
          />
        </div>
      </CardContent>
    </Card>
  );
}