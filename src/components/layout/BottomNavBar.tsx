import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBasket, CalendarDays, ListChecks, BookOpen, Star, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Definir los items principales para la barra inferior (máximo 5 recomendados)
const bottomNavigation = [
  { name: 'Inicio', href: '/app', icon: Home, exact: true, color: 'text-blue-500' },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket, color: 'text-green-500' },
  { name: 'Plan', href: '/app/planning', icon: CalendarDays, color: 'text-purple-500' },
  { name: 'Lista', href: '/app/shopping-list', icon: ListChecks, color: 'text-pink-500' },
  { name: 'Recetas', href: '/app/recipes', icon: ChefHat, color: 'text-orange-500' },
];

interface BottomNavBarProps {
  onOpenFavoriteRecipes: () => void;
}

export function BottomNavBar({ onOpenFavoriteRecipes }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-glass border-t border-border/40 md:hidden shadow-card-modern">
      {/* Fondo decorativo moderno */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/8 via-transparent to-accent/8" />

      <div className="flex justify-around items-center h-20 px-2 relative safe-area-bottom">
        {bottomNavigation.map((item, index) => {
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.1,
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="flex-1"
            >
              <NavLink to={item.href} end={item.exact} className="block">
                {({ isActive }: { isActive: boolean }) => (
                  <motion.div
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-2xl transition-modern relative overflow-hidden group mx-1",
                      isActive
                        ? 'bg-gradient-primary text-white shadow-glow scale-105'
                        : 'text-muted-foreground hover:bg-card/70 hover:text-foreground hover:shadow-card-modern hover:scale-[1.02]'
                    )}
                    whileTap={{
                      scale: 0.95,
                      transition: { duration: 0.1 }
                    }}
                  >
                    {/* Indicador activo animado */}
                    {isActive && (
                      <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-full"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Efecto shimmer mejorado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                    <div className="relative z-10 p-1 mb-1">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <item.icon className={cn(
                          "transition-all duration-300 h-5 w-5",
                          isActive
                            ? "text-white scale-110"
                            : `${item.color} group-hover:scale-110`
                        )} />
                      </motion.div>
                    </div>

                    <motion.span
                      className="text-[10px] font-semibold relative z-10 leading-tight"
                      animate={{
                        scale: isActive ? 1.05 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.name}
                    </motion.span>
                  </motion.div>
                )}
              </NavLink>
            </motion.div>
          );
        })}

        {/* Botón de Recetas Favoritas - Mejorado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.4,
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          className="flex-1"
        >
          <motion.button
            onClick={onOpenFavoriteRecipes}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 mx-1",
              'text-orange-600 hover:text-orange-700 hover:bg-orange-50 active:bg-orange-100 border border-orange-100 hover:border-orange-200'
            )}
            whileTap={{
              scale: 0.95,
              transition: { duration: 0.1 }
            }}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            aria-label="Abrir recetas favoritas"
          >
            <div className="p-1 mb-1">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <span className="text-[10px] font-semibold leading-tight">
              Favoritas
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Indicador de zona segura para dispositivos con notch */}
      <div className="h-safe-area-bottom bg-transparent" />
    </nav>
  );
}
