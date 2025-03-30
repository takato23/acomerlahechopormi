// src/components/ui/Spinner.tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Asumiendo que tienes cn de shadcn/ui

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn(
        'animate-spin text-primary', // Color primario por defecto
        sizeClasses[size],
        className
      )}
    />
  );
}