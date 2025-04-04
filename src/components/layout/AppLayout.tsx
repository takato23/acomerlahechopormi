import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { usePantryStore } from '@/stores/pantryStore';
import { FavoriteItemsSheet } from '@/features/pantry/components/FavoriteItemsSheet';
import { FavoriteRecipesSheet } from '@/features/recipes/components/FavoriteRecipesSheet'; // Añadir import
import { BottomNavBar } from './BottomNavBar'; // Importar BottomNavBar
// import { Button } from '@/components/ui/button'; // Ya no se usa para el menú
// import { Menu } from 'lucide-react'; // Ya no se usa
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';
import type { PantryItem } from '@/features/pantry/types';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFavoriteItemsSheetOpen, setIsFavoriteItemsSheetOpen] = useState(false); // Renombrar para items
  const [isFavoriteRecipesSheetOpen, setIsFavoriteRecipesSheetOpen] = useState(false); // Añadir estado para recetas
  const location = useLocation();
  const { user } = useAuth();

  const fetchPantryItems = usePantryStore(state => state.fetchItems);
  const pantryError = usePantryStore(state => state.error);
  const updatePantryItem = usePantryStore(state => state.updateItem);
  const deletePantryItem = usePantryStore(state => state.deleteItem);

  useEffect(() => {
    if (user) {
      fetchPantryItems();
    }
  }, [fetchPantryItems, user]);

  useEffect(() => {
    if (pantryError) {
      toast.error(`Error en la despensa: ${pantryError}`);
    }
  }, [pantryError]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleOpenFavoriteItems = useCallback(() => { // Renombrar para items
    setIsFavoriteItemsSheetOpen(true);
  }, []);

  const handleOpenFavoriteRecipes = useCallback(() => { // Añadir handler para recetas
    setIsFavoriteRecipesSheetOpen(true);
  }, []);

  const handleFavoriteItemsSheetOpenChange = (open: boolean) => { // Renombrar para items
    setIsFavoriteItemsSheetOpen(open);
  };

  const handleFavoriteRecipesSheetOpenChange = (open: boolean) => { // Añadir handler para recetas
    setIsFavoriteRecipesSheetOpen(open);
  };

  // Ya no se necesitan handlers para MobileNavSheet
  // const handleOpenMobileNav = useCallback(() => { ... });
  // const handleMobileNavOpenChange = (open: boolean) => { ... };

  const handleEditItemFromSheet = useCallback((item: PantryItem) => {
    toast.info(`Editar ${item.ingredient?.name} (funcionalidad pendiente)`);
    setIsFavoriteItemsSheetOpen(false); // Usar estado renombrado
  }, []);

  const handleDeleteItemFromSheet = useCallback(async (itemId: string) => {
    const success = await deletePantryItem(itemId);
    if (success) {
      toast.success("Item eliminado de favoritos y despensa.");
    } else {
      toast.error("Error al eliminar item.");
    }
  }, [deletePantryItem]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar para Desktop */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onOpenFavoriteItems={handleOpenFavoriteItems} // Usar handler renombrado
        onOpenFavoriteRecipes={handleOpenFavoriteRecipes} // Pasar nuevo handler
      />

      {/* Contenido Principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar Superior (simplificada) */}
        <header className="flex items-center justify-end h-14 px-4 border-b bg-card md:px-6">
           {/* Eliminar botón hamburguesa */}
           {/* Aquí irían otros elementos de la Navbar */}
           <div className="flex items-center gap-4">
             <span>Usuario</span> {/* Placeholder */}
           </div>
        </header>

        {/* Área de Contenido Principal con padding inferior para BottomNavBar en móvil */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8"> {/* Añadido pb-20 para móvil */}
          <Outlet />
        </main>
      </div>

      {/* Sheet de Favoritos (se mantiene) */}
      <FavoriteItemsSheet
        isOpen={isFavoriteItemsSheetOpen} // Usar estado renombrado y prop 'isOpen'
        onOpenChange={handleFavoriteItemsSheetOpenChange} // Usar handler renombrado
        onEditItem={handleEditItemFromSheet}
        onDeleteItem={handleDeleteItemFromSheet}
      />

      {/* Sheet de Recetas Favoritas */}
      <FavoriteRecipesSheet
        open={isFavoriteRecipesSheetOpen}
        onOpenChange={handleFavoriteRecipesSheetOpenChange}
      />

      {/* Barra de Navegación Inferior (solo móvil) */}
      <BottomNavBar onOpenFavoriteRecipes={handleOpenFavoriteRecipes} />
    </div>
  );
}