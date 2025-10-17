// src/components/layout/Sidebar.tsx
import { NavLink, Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, ShoppingBasket, CalendarDays, User, ListChecks, PanelLeftClose, PanelLeftOpen, Star, ChefHat, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { LiquidGlassCard } from '@/components/ui/LiquidGlass';
import { useEffect, useState, Fragment } from 'react';

const navigation: Array<{
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
  exact?: boolean;
  description?: string;
}> = [
  { name: 'Dashboard', href: '/app', icon: Home, exact: true, color: 'text-blue-500', description: 'Resumen personalizado' },
  { name: 'Recetas', href: '/app/recipes', icon: ChefHat, color: 'text-orange-500', description: 'Explorá y crea recetas' },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket, color: 'text-green-500', description: 'Gestioná tus ingredientes' },
  { name: 'Planificación', href: '/app/planning', icon: CalendarDays, color: 'text-purple-500', description: 'Organizá tus comidas' },
  { name: 'Lista Compras', href: '/app/shopping-list', icon: ListChecks, color: 'text-pink-500', description: 'Tu lista inteligente' },
  { name: 'Perfil', href: '/app/profile', icon: User, color: 'text-indigo-500', description: 'Preferencias y ajustes' },
];

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  onOpenFavoriteItems: () => void;
  onOpenFavoriteRecipes: () => void;
}

// Animations configuration
const sidebarVariants = {
  expanded: {
    width: 320, // w-80 = 320px
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for smooth animation
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  },
  collapsed: {
    width: 72, // w-18 = 72px
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.02,
      staggerDirection: -1, // Reverse stagger when collapsing
    }
  }
};

const contentVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    }
  },
  collapsed: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    }
  }
};

const iconVariants = {
  expanded: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    }
  },
  collapsed: {
    scale: 1.1,
    rotate: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    }
  }
};

export function Sidebar({ isCollapsed, toggleSidebar, onOpenFavoriteItems, onOpenFavoriteRecipes }: SidebarProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();

  // Handle animation state
  useEffect(() => {
    setIsAnimating(true);
    controls.start(isCollapsed ? "collapsed" : "expanded");

    const timer = setTimeout(() => setIsAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [isCollapsed, controls]);

  // Enhanced toggle with localStorage persistence
  const handleToggle = () => {
    if (!isAnimating) {
      toggleSidebar();
      // Persist the preference (inverse of current state since toggleSidebar will change it)
      try {
        localStorage.setItem('sidebar-collapsed', (!isCollapsed).toString());
      } catch (error) {
        console.warn('Could not save sidebar preference to localStorage:', error);
      }
    }
  };

  return (
    <motion.aside
      className="hidden md:flex relative flex-shrink-0 bg-card/95 backdrop-blur-glass border-r border-border/40 flex-col shadow-card-modern overflow-hidden"
      variants={sidebarVariants}
      animate={controls}
      initial={false}
      style={{
        willChange: 'width',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      }}
    >
      {/* Fondo decorativo moderno con gradientes */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3 rounded-r-3xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />

      {/* Botón de colapso mejorado con feedback visual */}
      <motion.div
        className="absolute top-6 right-4 z-20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="glass"
          size="icon"
          onClick={handleToggle}
          disabled={isAnimating}
          className={cn(
            "text-muted-foreground hover:text-primary shadow-card-modern hover:shadow-glow transition-all duration-300",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isAnimating && "animate-pulse"
          )}
          aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <motion.div
            animate={{
              rotate: isCollapsed ? 0 : 180,
              scale: isAnimating ? 0.9 : 1
            }}
            transition={{
              rotate: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
              scale: { duration: 0.2 }
            }}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </motion.div>
        </Button>
      </motion.div>

      {/* Logo con animaciones coordinadas */}
      <motion.div
        className="mb-10 flex justify-center relative z-10 pt-4 px-4"
        variants={contentVariants}
      >
        <Link to="/app">
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            variants={iconVariants}
          >
            <Logo
              className="transition-all duration-300 group-hover:drop-shadow-glow"
              isCollapsed={isCollapsed}
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  className="absolute inset-0 bg-gradient-primary rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 0.15 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </motion.div>

      {/* Navegación Principal con animaciones coordinadas */}
      <TooltipProvider delayDuration={isCollapsed ? 100 : 300} skipDelayDuration={200}>
        <motion.nav
          className="flex-grow px-3 relative z-10"
          variants={contentVariants}
        >
          <div className="space-y-1">
            {navigation.map((item) => {
              const link = (
                <NavLink to={item.href} end={item.exact} className="block">
                  {({ isActive }: { isActive: boolean }) => (
                    <motion.div
                      className={cn(
                        'flex items-center rounded-2xl py-3.5 text-sm font-medium transition-modern group relative overflow-hidden',
                        isCollapsed ? "px-3 justify-center" : "px-5 gap-3",
                        isActive
                          ? 'bg-gradient-primary text-white shadow-glow'
                          : 'text-muted-foreground hover:bg-card/70 hover:text-foreground hover:shadow-card-modern'
                      )}
                      variants={contentVariants}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2, type: "spring", stiffness: 400 }
                      }}
                      whileTap={{
                        scale: 0.98,
                        transition: { duration: 0.1 }
                      }}
                    >
                      {/* Efecto shimmer mejorado */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                      {/* Indicador activo mejorado */}
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                          layoutId="activeIndicator"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}

                      <motion.div
                        className="relative z-10 p-1.5"
                        variants={iconVariants}
                      >
                        <item.icon className={cn(
                          "flex-shrink-0 transition-all duration-300 h-5 w-5",
                          isActive
                            ? "text-white scale-110"
                            : `${item.color} group-hover:scale-110`
                        )} />
                      </motion.div>

                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            className="relative z-10 transition-all duration-300 font-medium truncate"
                            initial={{ opacity: 0, x: -10, width: 0 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              width: 'auto'
                            }}
                            exit={{
                              opacity: 0,
                              x: -10,
                              width: 0
                            }}
                            transition={{
                              duration: 0.3,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {!isCollapsed && item.description && (
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`${item.name}-description`}
                            className="relative z-10 text-xs text-muted-foreground/80 ml-auto"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.description}
                          </motion.span>
                        </AnimatePresence>
                      )}
                    </motion.div>
                  )}
                </NavLink>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={100}>
                    <TooltipTrigger asChild>
                      {link}
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-[220px]">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      {item.description && (
                        <p className="mt-1 text-xs leading-snug text-muted-foreground/80">{item.description}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Fragment key={item.name}>
                  {link}
                </Fragment>
              );
            })}
          </div>

          {/* Sección de Favoritos con animaciones coordinadas */}
        <motion.div
          className="space-y-3 pt-6 border-t border-border/30"
          variants={contentVariants}
        >
          {/* Título de sección animado */}
          <motion.div
            className={cn("px-2", isCollapsed ? "text-center" : "text-left")}
            variants={contentVariants}
          >
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.span
                  key="collapsed-favorites"
                  className="text-xs font-semibold text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  ★
                </motion.span>
              ) : (
                <motion.span
                  key="expanded-favorites"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  Favoritos
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Botones de favoritos para desktop */}
          <div className="hidden md:block space-y-3">
            <motion.div variants={contentVariants}>
              <LiquidGlassCard className="w-full hover:shadow-glow transition-all duration-300">
                {(() => {
                  const button = (
                    <motion.button
                      onClick={onOpenFavoriteItems}
                      className={cn(
                        'flex items-center py-3.5 text-sm font-medium w-full text-left transition-modern group relative overflow-hidden rounded-xl',
                        isCollapsed ? "justify-center px-3" : "px-4 gap-4",
                        'text-green-600 hover:text-green-700'
                      )}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2, type: "spring", stiffness: 400 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Abrir items favoritos"
                      disabled={isAnimating}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <motion.div
                        className="relative z-10 p-1.5"
                        variants={iconVariants}
                      >
                        <Heart className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                      </motion.div>
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            className="relative z-10 transition-all duration-300 font-medium truncate"
                            initial={{ opacity: 0, x: -10, width: 0 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              width: 'auto'
                            }}
                            exit={{
                              opacity: 0,
                              x: -10,
                              width: 0
                            }}
                            transition={{
                              duration: 0.3,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                          >
                            Items Favoritos
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );

                  return isCollapsed ? (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p className="text-sm font-semibold text-foreground">Items favoritos</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    button
                  );
                })()}
              </LiquidGlassCard>
            </motion.div>

            <motion.div variants={contentVariants}>
              <LiquidGlassCard className="w-full hover:shadow-glow transition-all duration-300">
                {(() => {
                  const button = (
                    <motion.button
                      onClick={onOpenFavoriteRecipes}
                      className={cn(
                        'flex items-center py-3.5 text-sm font-medium w-full text-left transition-modern group relative overflow-hidden rounded-xl',
                        isCollapsed ? "justify-center px-3" : "px-4 gap-4",
                        'text-orange-600 hover:text-orange-700'
                      )}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2, type: "spring", stiffness: 400 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Abrir recetas favoritas"
                      disabled={isAnimating}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <motion.div
                        className="relative z-10 p-1.5"
                        variants={iconVariants}
                      >
                        <Star className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200 fill-current" />
                      </motion.div>
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            className="relative z-10 transition-all duration-300 font-medium truncate"
                            initial={{ opacity: 0, x: -10, width: 0 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              width: 'auto'
                            }}
                            exit={{
                              opacity: 0,
                              x: -10,
                              width: 0
                            }}
                            transition={{
                              duration: 0.3,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                          >
                            Recetas Favoritas
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );

                  return isCollapsed ? (
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p className="text-sm font-semibold text-foreground">Recetas favoritas</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    button
                  );
                })()}
              </LiquidGlassCard>
            </motion.div>
          </div>

          {/* Mobile - Optimizado para rendimiento */}
          <div className="md:hidden space-y-2">
            <motion.button
              onClick={onOpenFavoriteItems}
              className={cn(
                'flex items-center gap-3 rounded-xl py-3 text-sm font-medium w-full text-left transition-all duration-200',
                'text-green-600 hover:bg-green-50 active:bg-green-100 border border-green-100 hover:border-green-200'
              )}
              whileTap={{ scale: 0.96 }}
              aria-label="Abrir items favoritos"
              disabled={isAnimating}
            >
              <Heart className="h-4 w-4 flex-shrink-0" />
              <span>Items Favoritos</span>
            </motion.button>

            <motion.button
              onClick={onOpenFavoriteRecipes}
              className={cn(
                'flex items-center gap-3 rounded-xl py-3 text-sm font-medium w-full text-left transition-all duration-200',
                'text-orange-600 hover:bg-orange-50 active:bg-orange-100 border border-orange-100 hover:border-orange-200'
              )}
              whileTap={{ scale: 0.96 }}
              aria-label="Abrir recetas favoritas"
              disabled={isAnimating}
            >
              <Star className="h-4 w-4 flex-shrink-0 fill-current" />
              <span>Recetas Favoritas</span>
            </motion.button>
          </div>
        </motion.div>
        </motion.nav>
      </TooltipProvider>
    </motion.aside>
  );
}
