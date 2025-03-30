// src/components/layout/Sidebar.tsx
import { NavLink, Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { Home, BookOpen, ShoppingBasket, CalendarDays, User, ListChecks, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion'; // Importar motion

const navigation = [
  { name: 'Dashboard', href: '/app', icon: Home, exact: true }, // Añadir exact para Dashboard
  { name: 'Recetas', href: '/app/recipes', icon: BookOpen },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket },
  { name: 'Planificación', href: '/app/planning', icon: CalendarDays },
  { name: 'Lista Compras', href: '/app/shopping-list', icon: ListChecks }, // Descomentar o añadir cuando se implemente
  { name: 'Perfil', href: '/app/profile', icon: User },
];
interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  return (
    <aside className={cn(
      "hidden md:flex relative flex-shrink-0 border-r border-border bg-card p-4 flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16 items-center" : "w-64"
    )}>
      {/* Botón de colapso flotante (movido aquí) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10" // Añadir z-10 por si acaso
        aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </Button>

      {/* Logo */}
      <div className={cn("mb-6 flex justify-center", isCollapsed ? "px-0" : "px-4")}>
        <Link to="/app" className={cn(isCollapsed ? "w-10 h-10" : "w-32 h-auto")}> {/* Ajustar tamaño contenedor */}
          <Logo className="w-full h-full" isCollapsed={isCollapsed} />
        </Link>
      </div>
      {/* Comentario eliminado */}
      <nav className="flex-grow space-y-1">
        {navigation.map((item) => {
          // Crear componente NavLink animado
          const MotionNavLink = motion(NavLink);
          return (
            <MotionNavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md py-2 text-sm font-medium', // Quitar transition-colors, Framer lo maneja
                isCollapsed ? "px-1 justify-center" : "px-3",
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground' // Quitar hover: de aquí
              )}
              // Props de Framer Motion
              whileHover={{
                scale: 1.03, // Ligero zoom
                backgroundColor: "hsl(var(--muted))", // Usar variable CSS de muted
                color: "hsl(var(--foreground))", // Asegurar color de texto en hover
                transition: { duration: 0.15 } // Transición rápida
              }}
              whileTap={{ scale: 0.98 }} // Efecto al hacer clic
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn(isCollapsed ? "sr-only" : "")}>{item.name}</span>
            </MotionNavLink>
          );
        })}
      </nav>
      {/* Podríamos añadir aquí info de usuario o botón logout si no está en Navbar superior */}
      {/* Footer (opcional, se podría quitar si no hay nada más) */}
      {/*
      <div className="mt-auto pt-4 border-t border-border text-center text-xs text-muted-foreground">
         v0.1.0
      </div>
      */}
    </aside>
  );
}