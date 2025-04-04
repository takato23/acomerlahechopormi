import { useState, useEffect } from 'react';

// Definir breakpoints (ajustar según el diseño)
const breakpoints = {
  mobile: 768,   // < 768px (Tailwind's md breakpoint)
  tablet: 1024,  // < 1024px (Tailwind's lg breakpoint)
  desktop: 1024, // >= 1024px
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function getDeviceConfig(width: number): Breakpoint {
  if (width < breakpoints.mobile) {
    return 'mobile';
  } else if (width >= breakpoints.mobile && width < breakpoints.tablet) { // >= 768 and < 1024
    return 'tablet';
  } else { // >= 1024
    return 'desktop';
  }
}

const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    // Asegurarse de que window esté definido (evita errores en SSR si aplica)
    if (typeof window !== 'undefined') {
      return getDeviceConfig(window.innerWidth);
    }
    // Valor por defecto o manejo para SSR
    return 'desktop'; // O el breakpoint más común/seguro
  });

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    const calcInnerWidth = () => {
      setBreakpoint(getDeviceConfig(window.innerWidth));
    };

    window.addEventListener('resize', calcInnerWidth);
    return () => window.removeEventListener('resize', calcInnerWidth);
  }, []);

  return breakpoint;
};

export default useBreakpoint;