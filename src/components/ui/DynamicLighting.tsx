import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DynamicLightingProps {
  className?: string;
  intensity?: number;
  color?: string;
  size?: number;
  position?: { x: number | string; y: number | string };
  followMouse?: boolean;
  pulse?: boolean;
}

export function DynamicLighting({
  className,
  intensity = 1,
  color = 'rgba(59, 130, 246, 0.3)',
  size = 300,
  position,
  followMouse = false,
  pulse = false
}: DynamicLightingProps) {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!followMouse || !lightRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (lightRef.current) {
        const rect = lightRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Movimiento sutil que sigue al mouse
        const moveX = deltaX * 0.1;
        const moveY = deltaY * 0.1;

        lightRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [followMouse]);

  // Calcular posición inicial si se proporciona
  const getPositionStyle = () => {
    if (!position) return {};

    const x = typeof position.x === 'string' ? position.x : `${position.x * 100}%`;
    const y = typeof position.y === 'string' ? position.y : `${position.y * 100}%`;

    return {
      position: 'absolute' as const,
      left: x,
      top: y,
      transform: 'translate(-50%, -50%)'
    };
  };

  return (
    <div
      ref={lightRef}
      className={cn(
        'pointer-events-none transition-transform duration-300 ease-out',
        followMouse ? 'absolute' : position ? 'absolute' : 'relative',
        pulse && 'animate-pulse',
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${size * 0.1}px)`,
        opacity: intensity,
        ...getPositionStyle()
      }}
    />
  );
}

// Componente para crear escenas con iluminación múltiple
export function LightingScene({
  children,
  className,
  lights = []
}: {
  children: React.ReactNode;
  className?: string;
  lights?: Array<{
    position: { x: number | string; y: number | string };
    color: string;
    size: number;
    intensity: number;
    pulse?: boolean;
  }>;
}) {
  const toUnit = (value: number | string) =>
    typeof value === 'number' ? `${value}%` : value;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Luces dinámicas */}
      {lights.map((light, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: toUnit(light.position.x),
            top: toUnit(light.position.y),
            transform: 'translate(-50%, -50%)'
          }}
        >
          <DynamicLighting
            position={light.position}
            color={light.color}
            size={light.size}
            intensity={light.intensity}
            pulse={light.pulse}
          />
        </div>
      ))}

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Efecto de spotlight que sigue al mouse
export function SpotlightEffect({
  children,
  className,
  color = 'rgba(59, 130, 246, 0.2)',
  size = 400
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Spotlight */}
      <div
        className="absolute pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 50%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(20px)'
        }}
      />

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
