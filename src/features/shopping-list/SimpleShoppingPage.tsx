import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/Spinner';
import { 
  Trash2, 
  RefreshCcw, 
  Plus, 
  ClipboardList, 
  Search,
  X,
  CheckCircle,
  ShoppingCart,
  Package,
  Mic,
  Grid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimpleShoppingStore } from './simpleShoppingStore';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SimpleShoppingPage() {
  const { items, isLoading, error, fetchItems, addItem, toggleItem, removeItem, clearChecked } = useSimpleShoppingStore();
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState('todos');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Filtrar elementos según la búsqueda y la pestaña activa
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'todos') return matchesSearch;
    if (activeTab === 'pendientes') return matchesSearch && !item.is_checked;
    if (activeTab === 'completados') return matchesSearch && item.is_checked;
    
    return matchesSearch;
  });
  
  const pendingCount = items.filter(item => !item.is_checked).length;
  const completedCount = items.filter(item => item.is_checked).length;
  
  useEffect(() => {
    // Cargar elementos al montar la página
    fetchItems();
  }, [fetchItems]);
  
  // Focus en el input al cargar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) return;
    
    setIsAdding(true);
    try {
      const result = await addItem(newItemName);
      
      if (result) {
        toast.success(`"${newItemName}" añadido a la lista.`);
        setNewItemName('');
        // Asegurar que estamos viendo los pendientes cuando añadimos un item
        if (activeTab === 'completados') {
          setActiveTab('todos');
        }
      } else {
        toast.error('No se pudo añadir el ítem.');
      }
    } catch (error) {
      console.error('Error al añadir ítem:', error);
      toast.error('Error al añadir el ítem.');
    } finally {
      setIsAdding(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleToggleItem = async (id: string, isChecked: boolean) => {
    try {
      const result = await toggleItem(id, isChecked);
      if (!result) {
        toast.error('No se pudo actualizar el ítem.');
      }
    } catch (error) {
      console.error('Error al actualizar ítem:', error);
      toast.error('Error al actualizar el ítem.');
    }
  };
  
  const handleRemoveItem = async (id: string, name: string) => {
    try {
      const success = await removeItem(id);
      if (success) {
        toast.success(`"${name}" eliminado de la lista.`);
      } else {
        toast.error('No se pudo eliminar el ítem.');
      }
    } catch (error) {
      console.error('Error al eliminar ítem:', error);
      toast.error('Error al eliminar el ítem.');
    }
  };
  
  const handleClearChecked = async () => {
    try {
      const success = await clearChecked();
      if (success) {
        toast.success('Ítems completados eliminados.');
      } else {
        toast.error('No se pudieron eliminar los ítems completados.');
      }
    } catch (error) {
      console.error('Error al limpiar ítems marcados:', error);
      toast.error('Error al limpiar ítems marcados.');
    }
  };
  
  const handleRefresh = () => {
    fetchItems();
    toast.info('Lista actualizada.');
  };
  
  const handleVoiceInput = () => {
    toast.info('Reconocimiento de voz no implementado aún.');
    // Aquí iría la implementación del reconocimiento de voz
  };

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4 sm:px-6">
      <PageHeader
        title="Mi Lista de Compras"
        description="Organiza tus compras de manera simple y efectiva."
        icon={<ShoppingCart className="h-6 w-6" />}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="my-6"
      >
        <form onSubmit={handleAddItem} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Añadir ítem a la lista..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="pl-10 pr-10"
              disabled={isAdding}
            />
            {newItemName && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute inset-y-0 right-0 px-3 hover:bg-transparent"
                onClick={() => setNewItemName('')}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleVoiceInput}
              title="Añadir por voz"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button 
              type="submit" 
              disabled={isAdding || !newItemName.trim()}
            >
              {isAdding ? <Spinner size="sm" /> : <Plus className="h-4 w-4 mr-2" />}
              Añadir
            </Button>
          </div>
        </form>
      </motion.div>
      
      <div className="mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="todos" className="flex gap-2 items-center">
                <Package className="h-4 w-4" />
                Todos
                <Badge variant="secondary" className="ml-1">{items.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pendientes" className="flex gap-2 items-center">
                <ShoppingCart className="h-4 w-4" />
                Pendientes
                <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completados" className="flex gap-2 items-center">
                <CheckCircle className="h-4 w-4" />
                Completados
                <Badge variant="secondary" className="ml-1">{completedCount}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="flex gap-1 items-center"
              >
                {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="flex gap-1 items-center"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleClearChecked}
                disabled={!items.some(item => item.is_checked)}
                className="flex gap-1 items-center"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TabsContent value="todos" className="mt-0">
            <ListContent 
              items={filteredItems} 
              isLoading={isLoading} 
              error={error} 
              viewMode={viewMode}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
              searchQuery={searchQuery}
            />
          </TabsContent>
          
          <TabsContent value="pendientes" className="mt-0">
            <ListContent 
              items={filteredItems} 
              isLoading={isLoading} 
              error={error} 
              viewMode={viewMode}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
              searchQuery={searchQuery}
            />
          </TabsContent>
          
          <TabsContent value="completados" className="mt-0">
            <ListContent 
              items={filteredItems} 
              isLoading={isLoading} 
              error={error} 
              viewMode={viewMode}
              onToggle={handleToggleItem}
              onRemove={handleRemoveItem}
              searchQuery={searchQuery}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {activeTab === 'todos' && filteredItems.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>
            {pendingCount} {pendingCount === 1 ? 'ítem pendiente' : 'ítems pendientes'}, {' '}
            {completedCount} {completedCount === 1 ? 'ítem completado' : 'ítems completados'}
          </p>
        </div>
      )}
    </div>
  );
}

interface ListContentProps {
  items: any[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'list' | 'grid';
  searchQuery: string;
  onToggle: (id: string, isChecked: boolean) => void;
  onRemove: (id: string, name: string) => void;
}

function ListContent({ items, isLoading, error, viewMode, onToggle, onRemove, searchQuery }: ListContentProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="md" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10 text-destructive bg-white rounded-lg border">
        {error}
      </div>
    );
  }
  
  if (items.length === 0) {
    if (searchQuery) {
      return (
        <div className="text-center py-10 text-slate-500 bg-white rounded-lg border">
          No se encontraron ítems que coincidan con "{searchQuery}".
        </div>
      );
    }
    
    return (
      <div className="text-center py-10 text-slate-500 bg-white rounded-lg border">
        No hay ítems en la lista.
      </div>
    );
  }
  
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`h-full ${item.is_checked ? 'bg-slate-50 border-slate-200' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={item.is_checked}
                      onCheckedChange={() => onToggle(item.id, item.is_checked)}
                    />
                    <span className={`${item.is_checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id, item.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <ul className="divide-y">
        <AnimatePresence>
          {items.map(item => (
            <motion.li 
              key={item.id} 
              className={`flex items-center justify-between px-4 py-3 ${item.is_checked ? 'bg-slate-50' : ''}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={item.is_checked}
                  onCheckedChange={() => onToggle(item.id, item.is_checked)}
                />
                <span className={`${item.is_checked ? 'line-through text-slate-400' : ''}`}>
                  {item.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id, item.name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
} 