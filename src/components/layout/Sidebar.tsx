// src/components/layout/Sidebar.tsx
import { NavLink, Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Home, BookOpen, ShoppingBasket, CalendarDays, User, ListChecks, PanelLeftClose, PanelLeftOpen, Star } from 'lucide-react'; // Añadir Star
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: Home, exact: true },
  { name: 'Recetas', href: '/app/recipes', icon: BookOpen },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket },
  { name: 'Planificación', href: '/app/planning', icon: CalendarDays },
  { name: 'Lista Compras', href: '/app/shopping-list', icon: ListChecks },
  { name: 'Perfil', href: '/app/profile', icon: User },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  onOpenFavoriteItems: () => void; // Renombrado para items
  onOpenFavoriteRecipes: () => void; // Añadido para recetas
}

export function Sidebar({ isCollapsed, toggleSidebar, onOpenFavoriteItems, onOpenFavoriteRecipes }: SidebarProps) {
  return (
    <aside className={cn(
      "hidden md:flex relative flex-shrink-0 border-r border-border bg-card p-4 flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16 items-center" : "w-64"
    )}>
      {/* Botón de colapso flotante */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
        aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </Button>

      {/* Logo */}
      <div className={cn("mb-6 flex justify-center", isCollapsed ? "px-0" : "px-4")}>
        <Link to="/app" className={cn(isCollapsed ? "w-10 h-10" : "w-32 h-auto")}>
          <Logo className="w-full h-full" isCollapsed={isCollapsed} />
        </Link>
      </div>

      <nav className="flex-grow space-y-1">
        {/* Navegación Principal */}
        {navigation.map((item) => {
          const MotionNavLink = motion.create(NavLink);
          return (
            <MotionNavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md py-2 text-sm font-medium',
                isCollapsed ? "px-1 justify-center" : "px-3",
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn(isCollapsed ? "sr-only" : "")}>{item.name}</span>
            </MotionNavLink>
          );
        })}

        {/* Botón de Items Favoritos (Despensa) */}
        <motion.button
          onClick={onOpenFavoriteItems} // Usar handler renombrado
          className={cn(
            'flex items-center gap-3 rounded-md py-2 text-sm font-medium w-full text-left',
            isCollapsed ? "px-1 justify-center" : "px-3",
            'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          whileTap={{ scale: 0.98 }}
          aria-label="Abrir items favoritos"
        >
          <Star className="h-5 w-5 flex-shrink-0" />
          <span className={cn(isCollapsed ? "sr-only" : "")}>Items Favoritos</span>
        </motion.button>

        {/* Botón de Recetas Favoritas */}
        <motion.button
          onClick={onOpenFavoriteRecipes} // Usar nuevo handler
          className={cn(
            'flex items-center gap-3 rounded-md py-2 text-sm font-medium w-full text-left',
            isCollapsed ? "px-1 justify-center" : "px-3",
            'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          whileTap={{ scale: 0.98 }}
          aria-label="Abrir recetas favoritas"
        >
          <Star className="h-5 w-5 flex-shrink-0" /> {/* Reutilizar icono Star por ahora */}
          <span className={cn(isCollapsed ? "sr-only" : "")}>Recetas Favoritas</span>
        </motion.button>
      </nav>
    </aside>
  );
}