import React from 'react';
import useBreakpoint from '@/hooks/useBreakpoint'; // Importar el hook
import DesktopLayout from './DesktopLayout';
import TabletLayout from './TabletLayout';
import MobileLayout from './MobileLayout';

interface ResponsiveLayoutProps {
  searchPanel: React.ReactNode;
  shoppingList: React.ReactNode;
  map: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ searchPanel, shoppingList, map }) => {
  const breakpoint = useBreakpoint();

  // Combinar lista y búsqueda para tablet/mobile
  const listAndSearch = (
    <>
      {/* Podríamos tener un componente específico para el panel de búsqueda en tablet/mobile si es necesario */}
      {/* O simplemente renderizar ambos aquí */}
      {searchPanel}
      {shoppingList}
    </>
  );

  switch (breakpoint) {
    case 'desktop':
      return <DesktopLayout searchPanel={searchPanel} shoppingList={shoppingList} map={map} />;
    case 'tablet':
      return <TabletLayout listAndSearch={listAndSearch} map={map} />;
    case 'mobile':
      return <MobileLayout listAndSearch={listAndSearch} map={map} />;
    default:
      // Fallback o manejo de caso inesperado
      return <DesktopLayout searchPanel={searchPanel} shoppingList={shoppingList} map={map} />;
  }
};

export default ResponsiveLayout;