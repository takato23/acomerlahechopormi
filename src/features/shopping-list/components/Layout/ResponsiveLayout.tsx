import React from 'react';
import useBreakpoint from '@/hooks/useBreakpoint'; // Importar el hook
import { DesktopLayout } from './DesktopLayout';
import { TabletLayout } from './TabletLayout';
import { MobileLayout } from './MobileLayout';

interface ResponsiveLayoutProps {
  shoppingList: React.ReactNode;
  map: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ shoppingList, map }) => {
  const breakpoint = useBreakpoint();

  switch (breakpoint) {
    case 'desktop':
      return <DesktopLayout shoppingList={shoppingList} map={map} />;
    case 'tablet':
      return <TabletLayout shoppingList={shoppingList} map={map} />;
    case 'mobile':
      return <MobileLayout shoppingList={shoppingList} map={map} />;
    default:
      // Fallback a Desktop
      return <DesktopLayout shoppingList={shoppingList} map={map} />;
  }
};

export default ResponsiveLayout;