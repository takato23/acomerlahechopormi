// src/components/layout/AppLayout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // Importar useLocation
import { Sidebar } from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion'; // Importar Framer Motion
import { cn } from '@/lib/utils'; // Importar cn
// Podríamos importar una Navbar superior reducida aquí si quisiéramos
// import Navbar from '@/components/sections/Navbar';

export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation(); // Obtener location

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} /> {/* Pasar props */}
      {/* Ajustar margen izquierdo y añadir transición */}
      <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
          // Sin margen en móvil, margen condicional desde md:
          isCollapsed ? "ml-0 md:ml-16" : "ml-0 md:ml-28" // Reducido aún más para centrar mejor
      )}>
        {/* Si quisiéramos mantener una Navbar superior reducida: */}
        {/* <Navbar /> */}
        {/* Reducir padding lateral en el contenedor principal */}
        {/* Envolver Outlet con AnimatePresence y motion.div */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname} // Clave única basada en la ruta
            initial={{ opacity: 0, y: 15 }} // Estado inicial (invisible, ligeramente abajo)
            animate={{ opacity: 1, y: 0 }} // Estado final (visible, en posición)
            exit={{ opacity: 0, y: -15 }} // Estado de salida (invisible, ligeramente arriba)
            transition={{ duration: 0.25, ease: "easeInOut" }} // Duración y easing
            // Añadir padding aquí si es necesario para el contenido de la página
            className="p-4 md:p-6" // Ejemplo de padding
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}