import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  padding?: string;
  onClick?: () => void;
  mode?: "standard" | "polar" | "prominent" | "shader";
  mouseContainer?: boolean;
}

export function LiquidGlass({
  children,
  className,
  displacementScale: _displacementScale = 64,
  blurAmount = 0.1,
  saturation = 130,
  aberrationIntensity: _aberrationIntensity = 2,
  elasticity = 0.35,
  cornerRadius = 20,
  padding = "16px",
  onClick,
  mode: _mode = "standard",
  mouseContainer = false
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mouseContainer || !containerRef.current || !highlightRef.current) {
      return;
    }

    const element = containerRef.current;
    const highlight = highlightRef.current;

    const handlePointerMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = Math.max(Math.min(event.clientX - rect.left, rect.width), 0);
      const y = Math.max(Math.min(event.clientY - rect.top, rect.height), 0);
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;
      highlight.style.setProperty('--pointer-x', `${percentX}%`);
      highlight.style.setProperty('--pointer-y', `${percentY}%`);
    };

    const handlePointerLeave = () => {
      highlight.style.removeProperty('--pointer-x');
      highlight.style.removeProperty('--pointer-y');
    };

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [mouseContainer]);

  return (
    <div
      ref={containerRef}
      className={cn('liquid-glass-container performance-optimized relative overflow-hidden', className)}
      style={{
        borderRadius: cornerRadius,
        padding,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <div
        ref={highlightRef}
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(circle at var(--pointer-x, 50%) var(--pointer-y, 30%), rgba(255,255,255,0.45), transparent 60%)',
          transition: 'background-position 200ms ease-out',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backdropFilter: `blur(${Math.max(blurAmount * 40, 6)}px) saturate(${saturation}%)`,
          WebkitBackdropFilter: `blur(${Math.max(blurAmount * 40, 6)}px) saturate(${saturation}%)`,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))',
        }}
      />
      <div className="relative z-10" style={{ transform: `translateZ(0) scale(${1 + elasticity * 0.02})` }}>
        {children}
      </div>
    </div>
  );
}

// Variantes preconfiguradas para diferentes usos
export function LiquidGlassHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <LiquidGlass
      displacementScale={60}
      blurAmount={0.06}
      saturation={110}
      aberrationIntensity={1.2}
      elasticity={0.2}
      cornerRadius={12}
      padding="8px 16px"
      mode="standard"
      className={cn('liquid-glass-header', className)}
    >
      {children}
    </LiquidGlass>
  );
}

export function LiquidGlassHeaderMobile({ children, className }: { children: React.ReactNode; className?: string }) {
  // Versión ultra-ligera para mobile
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-sm border border-border/30', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50" />
      <div className="relative z-10 p-3">
        {children}
      </div>
    </div>
  );
}

export function LiquidGlassButton({ children, onClick, className }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <LiquidGlass
      displacementScale={64}
      blurAmount={0.1}
      saturation={130}
      aberrationIntensity={2}
      elasticity={0.35}
      cornerRadius={100}
      padding="8px 16px"
      onClick={onClick}
      mode="standard"
      className={cn('liquid-glass-button cursor-pointer', className)}
    >
      {children}
    </LiquidGlass>
  );
}

export function LiquidGlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <LiquidGlass
      displacementScale={50} // Reducido para mejor rendimiento
      blurAmount={0.04} // Reducido para mejor rendimiento
      saturation={120} // Optimizado
      aberrationIntensity={1.2} // Reducido para mejor rendimiento
      elasticity={0.15} // Más rápido para mejor UX
      cornerRadius={16} // Más consistente con el diseño
      padding="16px" // Optimizado
      mode="standard"
      className={cn('liquid-glass-card', className)}
    >
      {children}
    </LiquidGlass>
  );
}
