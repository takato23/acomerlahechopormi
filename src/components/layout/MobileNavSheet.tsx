import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Home, BookOpen, ShoppingBasket, CalendarDays, User, ListChecks, Star } from 'lucide-react'; // Incluir Star
import { cn } from '@/lib/utils';
import { Logo } from '@/components/common/Logo';

// Reutilizar la misma estructura de navegación
const navigation = [
  { name: 'Dashboard', href: '/app', icon: Home, exact: true },
  { name: 'Recetas', href: '/app/recipes', icon: BookOpen },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket },
  { name: 'Planificación', href: '/app/planning', icon: CalendarDays },
  { name: 'Lista Compras', href: '/app/shopping-list', icon: ListChecks },
  { name: 'Perfil', href: '/app/profile', icon: User },
];

interface MobileNavSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenFavorites: () => void; // Para abrir el sheet de favoritos desde aquí también
}

export function MobileNavSheet({ isOpen, onOpenChange, onOpenFavorites }: MobileNavSheetProps) {

  // Función para cerrar este sheet antes de abrir el de favoritos
  const handleOpenFavoritesClick = () => {
    onOpenChange(false); // Cierra el nav sheet
    // Pequeño delay para asegurar que el cierre se procese antes de abrir el otro
    setTimeout(onOpenFavorites, 150); 
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* El SheetTrigger estará en la Navbar */}
      <SheetContent side="left" className="w-[280px] p-4 flex flex-col"> {/* Ajustar ancho y padding */}
        <SheetHeader className="mb-6">
          <SheetTitle>
            <Link to="/app" className="inline-block w-32" onClick={() => onOpenChange(false)}>
              <Logo className="w-full h-auto" isCollapsed={false} /> {/* Logo siempre expandido */}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-grow space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              onClick={() => onOpenChange(false)} // Cerrar al hacer clic en un enlace
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors', // Texto más grande
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          {/* Botón de Favoritos */}
           <button
             onClick={handleOpenFavoritesClick} // Usar handler que cierra este sheet primero
             className={cn(
               'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium w-full text-left',
               'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
             )}
             aria-label="Abrir favoritos"
           >
             <Star className="h-5 w-5 flex-shrink-0" />
             <span>Favoritos</span>
           </button>
        </nav>
        {/* Podríamos añadir un footer si es necesario */}
      </SheetContent>
    </Sheet>
  );
}