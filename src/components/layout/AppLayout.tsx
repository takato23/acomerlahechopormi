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
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notifications';
import type { PantryItem } from '@/features/pantry/types';
import { LiquidGlassHeader, LiquidGlassHeaderMobile } from '@/components/ui/LiquidGlass';

export function AppLayout() {
  // Initialize sidebar state from localStorage with fallback to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn('Could not load sidebar preference from localStorage:', error);
      return false;
    }
  });
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
      notifyError(`Error en la despensa: ${pantryError}`);
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
    notifyInfo(`Editar ${item.ingredient?.name} (funcionalidad pendiente)`);
    setIsFavoriteItemsSheetOpen(false); // Usar estado renombrado
  }, []);

  const handleDeleteItemFromSheet = useCallback(async (itemId: string) => {
    const success = await deletePantryItem(itemId);
    if (success) {
      notifySuccess("Item eliminado de favoritos y despensa.");
    } else {
      notifyError("Error al eliminar item.");
    }
  }, [deletePantryItem]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onOpenFavoriteItems={handleOpenFavoriteItems}
        onOpenFavoriteRecipes={handleOpenFavoriteRecipes}
      />

      {/* Contenido Principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header Simple */}
        <header className="h-16 px-6 border-b border-border bg-background">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-bold">🍳</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                A Comerla
              </span>
            </div>

            {/* Usuario */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-6">
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
