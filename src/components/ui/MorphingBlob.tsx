import React from 'react';
import { cn } from '@/lib/utils';

interface MorphingBlobProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  children?: React.ReactNode;
}

export function MorphingBlob({
  className,
  size = 'md',
  color = 'bg-gradient-primary',
  children
}: MorphingBlobProps) {
  const sizeClasses = {
    xs: 'w-12 h-12',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  return (
    <div
      className={cn(
        'relative morphing-blob',
        sizeClasses[size],
        color,
        className
      )}
    >
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {children}
        </div>
      )}

      {/* Glow effect */}
      <div
        className="absolute inset-0 morphing-blob opacity-50 blur-xl scale-150"
        style={{ background: 'inherit' }}
      />
    </div>
  );
}

// Componente para blobs decorativos flotantes
export function FloatingBlob({
  className,
  delay = 0,
  duration = 8,
  ...props
}: MorphingBlobProps & { delay?: number; duration?: number }) {
  return (
    <div
      className="absolute float"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      <MorphingBlob
        className={cn('opacity-20 hover:opacity-40 transition-opacity duration-300', className)}
        {...props}
      />
    </div>
  );
}
