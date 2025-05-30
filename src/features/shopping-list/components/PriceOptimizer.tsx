import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Ajustar estos tipos si los contextos/componentes han cambiado
// import { ShoppingItem as ContextShoppingItem } from '@/context/contexts/ShoppingContext'; 
// import { ShoppingItem as ComponentShoppingItem } from '@/components/shopping/ShoppingListItem';
type ShoppingListItem = any; // Renombrado para claridad

// Servicios y tipos de BuscaPrecios
import { searchProducts as searchBuscaPrecios, BuscaPreciosProduct, SearchProductsResult } from '../services/buscaPreciosService'; // Importar SearchProductsResult
// Quitar servicios no usados
// import { Store, preciosClarosService, Product } from '../services/preciosClarosService';
// import { ratoneandoService, RatoneandoStore, RatoneandoProductsByStore, RatoneandoProduct } from '../services/ratoneandoService';
import { Button } from '@/components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { toast } from 'sonner'; // Usar sonner directamente
import { 
  ArrowLeft, 
  ShoppingCart, 
  TrendingDown, 
  Store as StoreIcon, 
  Check, 
  ExternalLink, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Info,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Quitar import no usado
// import { ratoneandoService, RatoneandoStore, RatoneandoProductsByStore, RatoneandoProduct } from '../services/ratoneandoService';

// Tipo para los resultados de optimización usando BuscaPrecios
interface OptimizedBuscaPreciosResult {
  item: ShoppingListItem; // El item original de la lista
  results: BuscaPreciosProduct[]; // Mantiene los productos encontrados en caso de éxito
  bestPrice: number;
  bestProduct?: BuscaPreciosProduct; // El producto específico con el mejor precio
  originalPrice: number; // Podríamos estimar un precio original o usar el más caro encontrado
  savings: number;
  savingsPercentage: number;
  searchStatus: 'success' | 'not_found' | 'pending' | 'error';
  errorMessage?: string;
}

interface PriceOptimizerProps {
  shoppingList: ShoppingListItem[];
  onClose: () => void;
}

const PriceOptimizer: React.FC<PriceOptimizerProps> = ({ 
  shoppingList, 
  // selectedStores, // Eliminado - No necesario para buscaPrecios
  onClose 
}) => {
  // const { toast } = useToast(); // Eliminado hook useToast
  // const { toast } = useToast(); // Reemplazar con sonner si es necesario
  // const showToast = (opts: any) => console.log("Toast:", opts); // Eliminado placeholder, usar toast()

  // Estado adaptado para BuscaPrecios
  const [optimizedItems, setOptimizedItems] = useState<OptimizedBuscaPreciosResult[]>([]); // Usar el tipo correcto
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0); // Mantener para la barra de progreso
  const [totalSavings, setTotalSavings] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [optimizedTotal, setOptimizedTotal] = useState(0);
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Estados no necesarios para buscaPrecios eliminados:
  // const [storeRecommendations, ...]
  // const [serviceStatus, ...]
  // const [usingRatoneando, ...]

  // Función para alternar la expansión de productos para un item
  const toggleProductExpansion = (itemId: string) => {
    setExpandedProductIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const optimizeShoppingList = async () => {
    // Ya no necesitamos selectedStores
    if (shoppingList.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(10); // Iniciar progreso
      
      // Lógica simplificada para buscaPrecios
      const pendingItems = shoppingList.filter(item => !item.completed); // Asumiendo 'completed'
      const totalItems = pendingItems.length;
      let processedCount = 0;

      const resultsPromises = pendingItems.map(async (item) => {
        try {
          const searchResult: SearchProductsResult = await searchBuscaPrecios(item.name);
          processedCount++;
          setProgress(10 + (processedCount / totalItems) * 80); // Actualizar progreso (10% a 90%)

          // Manejar el caso de error primero
          if (searchResult.error) {
              console.error(`Error buscando item ${item.name} (reportado por searchBuscaPrecios):`, searchResult.originalError);
              // Podríamos usar searchResult.fallbackSuggestions si quisiéramos mostrarlas aquí
              return {
                  item,
                  results: [], // No hay resultados exitosos
                  bestPrice: item.estimatedPrice || 0,
                  originalPrice: item.estimatedPrice || 0,
                  savings: 0,
                  savingsPercentage: 0,
                  searchStatus: 'error' as const,
                  errorMessage: searchResult.originalError.message || 'Error desconocido'
              };
          }

          // Si no hubo error, searchResult.products contiene los resultados
          const products = searchResult.products;

          if (products.length === 0) {
            return {
              item,
              results: [],
              bestPrice: item.estimatedPrice || 0, // Usar precio estimado si existe
              originalPrice: item.estimatedPrice || 0,
              savings: 0,
              savingsPercentage: 0,
              searchStatus: 'not_found' as const
            };
          }

          // Encontrar el mejor precio y producto
          let bestPrice = Infinity;
          let bestProduct: BuscaPreciosProduct | undefined;
          products.forEach(p => {
            if (p.precio < bestPrice) {
              bestPrice = p.precio;
              bestProduct = p;
            }
          });

          // Calcular precio original (usar el más caro encontrado o estimado)
          const prices = products.map(p => p.precio).filter(p => !isNaN(p));
          const maxPrice = prices.length > 0 ? Math.max(...prices) : bestPrice;
          const originalPrice = item.estimatedPrice || maxPrice; // Priorizar estimado si existe

          const savings = originalPrice - bestPrice;
          const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

          // Multiplicar por cantidad
          const finalBestPrice = bestPrice * (item.quantity || 1); // Asumir cantidad 1 si no existe
          const finalOriginalPrice = originalPrice * (item.quantity || 1);

          return {
            item,
            results: products, // Guardar los productos encontrados
            bestPrice: finalBestPrice,
            bestProduct,
            originalPrice: finalOriginalPrice,
            savings: savings * (item.quantity || 1),
            savingsPercentage,
            searchStatus: 'success' as const
          };

        } catch (unexpectedError) {
          // Este catch es por si la promesa misma falla (no debería con el manejo interno)
          console.error(`Error inesperado procesando item ${item.name}:`, unexpectedError);
          processedCount++;
          setProgress(10 + (processedCount / totalItems) * 80);
          return {
            item,
            results: [],
            bestPrice: item.estimatedPrice || 0,
            originalPrice: item.estimatedPrice || 0,
            savings: 0,
            savingsPercentage: 0,
            searchStatus: 'error' as const,
            errorMessage: unexpectedError instanceof Error ? unexpectedError.message : 'Error inesperado en procesamiento'
          };
        }
      });

      // Asegurar que el tipo sea correcto para TypeScript
      const unifiedResults: OptimizedBuscaPreciosResult[] = await Promise.all(resultsPromises);
      setProgress(95); // Casi listo

      // Ordenar por mayor ahorro porcentual
      unifiedResults.sort((a, b) => b.savingsPercentage - a.savingsPercentage);
      
      // Calcular totales
      const original = unifiedResults.reduce((sum, item) => sum + item.originalPrice, 0);
      const optimized = unifiedResults.reduce((sum, item) => sum + item.bestPrice, 0);
      const savings = original - optimized;

      setOptimizedItems(unifiedResults);
      setOriginalTotal(original);
      setOptimizedTotal(optimized);
      setTotalSavings(savings);
      // setStoreRecommendations([]); // Limpiar recomendaciones no aplicables

      if (unifiedResults.some(r => r.searchStatus === 'success')) {
        toast.success("Optimización completada (BuscaPrecios)", {
          description: `Ahorro potencial: $${savings.toFixed(2)} (${original > 0 ? Math.round((savings/original)*100) : 0}%)`,
        });
      } else if (unifiedResults.every(r => r.searchStatus === 'not_found')) {
         toast.info("No se encontraron productos", {
          description: "No se hallaron coincidencias para los items de tu lista.",
        });
      } else {
         toast.warning("Optimización parcial", {
          description: "Algunos productos no pudieron ser encontrados o generaron error.",
        });
      }
      
      setProgress(100); // Completado
      
      // La lógica anterior que usaba Ratoneando/PreciosClaros se eliminó
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    optimizeShoppingList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingList]); // Depender solo de shoppingList

  // Función para forzar un reintento
  const handleRetry = () => {
    // Limpiar el caché y reintentar
    // No hay caché específica que limpiar para buscaPrecios en este diseño
    // preciosClarosService.clearCache();
    // ratoneandoService.clearCache();
    optimizeShoppingList(); // Re-ejecutar la optimización
  };

  // Si no hay tiendas o lista, mostrar mensaje
  // Ya no necesitamos selectedStores
  if (shoppingList.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col p-4 sm:p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Optimizador de Compra</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft size={16} />
            <span className="ml-1">Volver</span>
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <ShoppingCart size={48} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground">
            Tu lista de compras está vacía
          </p>
          <Button onClick={onClose} className="mt-4">Volver</Button>
        </div>
      </motion.div>
    );
  }

  // Funciones eliminadas que no aplican a buscaPrecios:
  // getStoreDirectionsUrl
  // formatProductPresentation

  // isPreciosClarosStore
  // isRatoneandoProduct

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col p-4 sm:p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <TrendingDown className="mr-2" size={20} />
          Optimizador de Compra (BuscaPrecios)
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft size={16} />
          <span className="ml-1">Volver</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <h3 className="text-lg font-medium mb-2">Comparando precios...</h3>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Buscando los mejores precios... {/* Limpiado comentario */}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error en el servicio</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={onClose}>
                Volver
              </Button>
              <Button onClick={handleRetry} className="gap-2">
                <RefreshCw size={16} />
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      ) : optimizedItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <WifiOff size={48} className="text-muted-foreground mb-4" />
          <p className="text-center text-muted-foreground mb-4">
            No se pudo obtener información de precios
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Volver
            </Button>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw size={16} />
              Reintentar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Alertas de estado de servicio eliminadas */}
          
          <div className="bg-primary/5 rounded-lg p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Precio original estimado:</span>
              <span className="font-medium">${originalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Precio optimizado:</span>
              <span className="font-medium">${optimizedTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-primary">
              <span>Ahorro total:</span>
              <span>${totalSavings.toFixed(2)} ({totalSavings > 0 && originalTotal > 0 ? Math.round((totalSavings/originalTotal)*100) : 0}%)</span>
            </div>
          </div>

          {/* Botón para recargar los datos */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="w-full gap-2"
            >
              <RefreshCw size={14} />
              Actualizar precios
            </Button>
          </div>

          {/* Recomendaciones de tiendas eliminadas */}
          {/* Sección "Supermercados comparados" eliminada */}
          
          <h3 className="text-lg font-medium my-4">Resultados por producto</h3>
          
          <div className="space-y-4">
            <AnimatePresence>
              {optimizedItems.map((optimizedItem, index) => (
                <motion.div
                  key={optimizedItem.item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-morphism rounded-lg p-4 ${
                    optimizedItem.searchStatus === 'not_found' ? 'border border-amber-300/30' : 
                    optimizedItem.searchStatus === 'error' ? 'border border-red-300/30' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium text-sm">
                            {optimizedItem.item.name} ({optimizedItem.item.quantity} {optimizedItem.item.unit})
                          </h4>
                          {optimizedItem.savingsPercentage > 15 && (
                            <span className="ml-2 bg-green-500/10 text-green-500 text-xs px-2 py-0.5 rounded-full">
                              Oferta
                            </span>
                          )}
                          {optimizedItem.searchStatus === 'not_found' && (
                            <span className="ml-2 bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full flex items-center">
                              <AlertCircle size={10} className="mr-1" />
                              Precio estimado
                            </span>
                          )}
                          {optimizedItem.searchStatus === 'error' && (
                            <span className="ml-2 bg-red-500/10 text-red-500 text-xs px-2 py-0.5 rounded-full flex items-center">
                              <AlertCircle size={10} className="mr-1" />
                              Error
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <div className="line-through text-muted-foreground text-sm">
                            ${optimizedItem.originalPrice.toFixed(2)}
                          </div>
                          <div className="text-sm font-bold">
                            ${optimizedItem.bestPrice.toFixed(2)}
                          </div>
                          {optimizedItem.savingsPercentage > 0 && (
                            <div className="text-xs text-green-500">
                              -{Math.round(optimizedItem.savingsPercentage)}%
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mostrar botón "Ver opciones" solo si hay resultados exitosos */}
                      {optimizedItem.searchStatus === 'success' && optimizedItem.results.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleProductExpansion(optimizedItem.item.id)}
                        >
                          {optimizedItem.results.length} opci{optimizedItem.results.length === 1 ? 'ón' : 'ones'} {expandedProductIds[optimizedItem.item.id] ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
                        </Button>
                      )}
                    </div>
                    
                    {/* Mensaje de error específico para este item */}
                    {optimizedItem.searchStatus === 'error' && optimizedItem.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-md text-xs text-red-700 dark:text-red-300">
                        {optimizedItem.errorMessage}
                      </div>
                    )}
                    
                    {/* Opciones de productos y precios expandibles */}
                    {/* Mostrar resultados de BuscaPrecios si está expandido y hay resultados */}
                    {expandedProductIds[optimizedItem.item.id] && optimizedItem.searchStatus === 'success' && optimizedItem.results.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 border-t pt-3 space-y-2"
                      >
                        {optimizedItem.results.map((product, index) => (
                          <div
                            key={product.id || `result-${index}`}
                            className={`p-3 rounded-md text-sm flex items-center gap-3 ${index === 0 ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50' : 'bg-secondary/30'}`}
                          >
                            <img src={product.imagen} alt={product.nombre} className="w-10 h-10 object-contain rounded flex-shrink-0" />
                            <div className="flex-grow">
                              <div className="font-medium text-xs">{product.nombre}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
                                <StoreIcon size={10} className="mr-1" /> {product.tienda}
                              </div>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                                <div className={`font-bold ${index === 0 ? 'text-primary' : ''}`}>
                                    ${product.precio.toFixed(2)}
                                </div>
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a href={product.url} target="_blank" rel="noopener noreferrer" className="mt-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-primary">
                                          <ExternalLink size={12} />
                                        </Button>
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Ver en {product.tienda}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    
                    {/* Mensaje de producto no encontrado */}
                    {optimizedItem.searchStatus === 'not_found' && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                        <div className="flex items-start">
                          <Info size={16} className="text-amber-500 mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-700 dark:text-amber-300">No se encontraron resultados exactos</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Intenta buscar este producto con otro nombre o revisa si es un ingrediente básico que ya tienes en casa.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <Button 
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Check size={16} className="mr-2" />
          Entendido
        </Button>
      </div>
    </motion.div>
  );
};

export default PriceOptimizer;