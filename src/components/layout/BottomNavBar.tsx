import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBasket, CalendarDays, ListChecks, BookOpen, Star } from 'lucide-react'; // Añadir Star
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Importar Button si se usa como base

// Definir los items principales para la barra inferior (máximo 5 recomendados)
const bottomNavigation = [
  { name: 'Inicio', href: '/app', icon: Home, exact: true },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket },
  { name: 'Plan', href: '/app/planning', icon: CalendarDays },
  { name: 'Lista', href: '/app/shopping-list', icon: ListChecks },
  { name: 'Recetas', href: '/app/recipes', icon: BookOpen },
];

interface BottomNavBarProps {
  onOpenFavoriteRecipes: () => void;
}

export function BottomNavBar({ onOpenFavoriteRecipes }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden"> {/* Visible solo en móvil */}
      <div className="flex justify-around items-center h-16 px-2"> {/* Altura y padding */}
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 p-1 rounded-md transition-colors",
              isActive
                ? 'text-primary scale-105' // Resaltar activo
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 mb-0.5" /> {/* Icono */}
            <span className="text-[10px] font-medium">{item.name}</span> {/* Texto pequeño */}
          </NavLink>
        ))}

        {/* Botón de Recetas Favoritas */}
        <button
          onClick={onOpenFavoriteRecipes}
          className={cn(
            "flex flex-col items-center justify-center flex-1 p-1 rounded-md transition-colors",
            'text-muted-foreground hover:text-foreground' // Estilo similar a NavLink inactivo
          )}
          aria-label="Abrir recetas favoritas"
        >
          <Star className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] font-medium">Favoritas</span>
        </button>

      </div>
    </nav>
  );
}