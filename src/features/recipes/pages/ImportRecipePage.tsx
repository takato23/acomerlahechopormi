import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Clock, Users, Tag, ExternalLink, Plus, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { searchSpoonacularRecipes, importSpoonacularRecipe, SpoonacularRecipe } from '../services/externalRecipeService';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';

interface SearchFilters {
  diet?: string;
  cuisine?: string;
  maxReadyTime?: number;
}

const ImportRecipePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState<{[key: string]: boolean}>({});
  const [searchResults, setSearchResults] = useState<SpoonacularRecipe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  
  const resultsPerPage = 10;
  
  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim()) {
      toast.error("Ingresa un término de búsqueda");
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const offset = (page - 1) * resultsPerPage;
      const results = await searchSpoonacularRecipes({
        query: searchTerm,
        diet: searchFilters.diet,
        cuisine: searchFilters.cuisine,
        maxReadyTime: searchFilters.maxReadyTime,
        offset,
        number: resultsPerPage
      });
      
      setSearchResults(results.results);
      setTotalResults(results.totalResults);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error al buscar recetas:', error);
      toast.error("No se pudieron obtener resultados. Inténtalo más tarde.");
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleImport = async (recipeId: number) => {
    if (!user) {
      toast.error("Debes iniciar sesión para importar recetas");
      return;
    }
    
    setIsImporting(prev => ({ ...prev, [recipeId]: true }));
    
    try {
      const importedRecipe = await importSpoonacularRecipe(recipeId, user.id);
      toast.success("Receta importada exitosamente");
      navigate(`/app/recipes/${importedRecipe.id}`);
    } catch (error) {
      console.error('Error al importar receta:', error);
      toast.error("No se pudo importar la receta. Inténtalo más tarde.");
    } finally {
      setIsImporting(prev => ({ ...prev, [recipeId]: false }));
    }
  };
  
  const handlePageChange = (page: number) => {
    handleSearch(page);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">
        Importar Recetas
      </h1>
      <p className="text-slate-600 mb-6">
        Busca recetas en línea e impórtalas a tu colección personal.
      </p>
      
      {/* Buscador */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Buscar Recetas</CardTitle>
          <CardDescription>Encuentra recetas de Spoonacular para importar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar recetas..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={() => handleSearch(1)} 
                disabled={isSearching || !searchTerm.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar
              </Button>
            </div>
            
            {/* Filtros avanzados - podemos implementarlos después */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cuisine">Cocina</Label>
                <select
                  id="cuisine"
                  value={searchFilters.cuisine || ''}
                  onChange={e => setSearchFilters(prev => ({ ...prev, cuisine: e.target.value || undefined }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Cualquiera</option>
                  <option value="italian">Italiana</option>
                  <option value="mexican">Mexicana</option>
                  {/* ... más opciones ... */}
            {/* </select>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>
      
      {/* Resultados */}
      {hasSearched && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {isSearching ? 'Buscando...' : `Resultados (${totalResults})`}
          </h2>
          
          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i} className="h-[300px] flex flex-col">
                  <div className="h-40 bg-slate-200 rounded-t-lg">
                    <Skeleton className="h-full w-full rounded-t-lg" />
                  </div>
                  <CardContent className="py-4 flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter className="py-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              No se encontraron resultados para "{searchTerm}". Intenta con otra búsqueda.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {searchResults.map(recipe => (
                  <Card key={recipe.id} className="overflow-hidden flex flex-col h-full">
                    {recipe.image && (
                      <div className="h-40 relative overflow-hidden">
                        <img 
                          src={recipe.image} 
                          alt={recipe.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="py-4 flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {recipe.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {recipe.dishTypes?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="bg-slate-100">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{recipe.readyInMinutes} min</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{recipe.servings} porciones</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button
                        onClick={() => handleImport(recipe.id)}
                        disabled={isImporting[recipe.id] || !user}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isImporting[recipe.id] ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Importar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Paginación */}
              {totalResults > resultsPerPage && (
                <div className="flex justify-center mb-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalResults / resultsPerPage)}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportRecipePage; 