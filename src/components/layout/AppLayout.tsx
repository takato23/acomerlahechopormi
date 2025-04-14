import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { usePantryStore } from '@/stores/pantryStore';
import { FavoriteItemsSheet } from '@/features/pantry/components/FavoriteItemsSheet';
import { FavoriteRecipesSheet } from '@/features/recipes/components/FavoriteRecipesSheet';
import { BottomNavBar } from './BottomNavBar';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';
import type { PantryItem } from '@/features/pantry/types';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFavoriteItemsSheetOpen, setIsFavoriteItemsSheetOpen] = useState(false);
  const [isFavoriteRecipesSheetOpen, setIsFavoriteRecipesSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

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

  // Manejo de autenticación
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleOpenFavoriteItems = useCallback(() => {
    setIsFavoriteItemsSheetOpen(true);
  }, []);

  const handleOpenFavoriteRecipes = useCallback(() => {
    setIsFavoriteRecipesSheetOpen(true);
  }, []);

  const handleFavoriteItemsSheetOpenChange = (open: boolean) => {
    setIsFavoriteItemsSheetOpen(open);
  };

  const handleFavoriteRecipesSheetOpenChange = (open: boolean) => {
    setIsFavoriteRecipesSheetOpen(open);
  };

  const handleEditItemFromSheet = useCallback((item: PantryItem) => {
    toast.info(`Editar ${item.ingredient?.name} (funcionalidad pendiente)`);
    setIsFavoriteItemsSheetOpen(false);
  }, []);

  const handleDeleteItemFromSheet = useCallback(async (itemId: string) => {
    const success = await deletePantryItem(itemId);
    if (success) {
      toast.success("Item eliminado de favoritos y despensa.");
    } else {
      toast.error("Error al eliminar item.");
    }
  }, [deletePantryItem]);

  // Si está cargando, no mostrar nada
  if (loading) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar solo se muestra si hay usuario autenticado */}
      {user && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          onOpenFavoriteItems={handleOpenFavoriteItems}
          onOpenFavoriteRecipes={handleOpenFavoriteRecipes}
        />
      )}

      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between h-14 px-4 border-b bg-card md:px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden md:inline">{user.email}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Cerrar sesión</span>
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogin}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Iniciar sesión</span>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>

        {user && (
          <>
            <FavoriteItemsSheet
              isOpen={isFavoriteItemsSheetOpen}
              onOpenChange={handleFavoriteItemsSheetOpenChange}
              onEditItem={handleEditItemFromSheet}
              onDeleteItem={handleDeleteItemFromSheet}
            />
            <FavoriteRecipesSheet
              open={isFavoriteRecipesSheetOpen}
              onOpenChange={handleFavoriteRecipesSheetOpenChange}
            />
            <BottomNavBar onOpenFavoriteRecipes={handleOpenFavoriteRecipes} />
          </>
        )}
      </div>
    </div>
  );
}
