import React from 'react';
import { cn } from '@/lib/utils';

interface AdvancedTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'gradient' | 'glow' | '3d' | 'rainbow' | 'neon' | 'metallic' | 'glitch';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  animated?: boolean;
}

export function AdvancedText({
  children,
  className,
  variant = 'gradient',
  size = 'base',
  weight = 'normal',
  animated = false
}: AdvancedTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const variantClasses = {
    gradient: 'bg-gradient-primary bg-clip-text text-transparent',
    glow: 'text-glow text-primary',
    '3d': 'text-3d',
    rainbow: 'text-gradient-rainbow',
    neon: 'text-primary drop-shadow-[0_0_10px_currentColor]',
    metallic: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-clip-text text-transparent',
    glitch: 'relative text-primary'
  };

  const baseClasses = cn(
    'font-display',
    sizeClasses[size],
    weightClasses[weight],
    variantClasses[variant],
    animated && 'animate-pulse',
    className
  );

  if (variant === 'glitch') {
    return (
      <span className={cn(baseClasses, 'relative inline-block')}>
        {children}
        {/* Efectos glitch */}
        <span className="absolute inset-0 text-red-500 animate-pulse opacity-75 transform translate-x-1">
          {children}
        </span>
        <span className="absolute inset-0 text-blue-500 animate-pulse opacity-50 transform -translate-x-1">
          {children}
        </span>
      </span>
    );
  }

  return (
    <span className={baseClasses}>
      {children}
    </span>
  );
}

// Componente para texto con efectos de máquina de escribir
export function TypewriterText({
  texts,
  className,
  speed = 100,
  delay = 1000
}: {
  texts: string[];
  className?: string;
  speed?: number;
  delay?: number;
}) {
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);
  const [currentText, setCurrentText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const text = texts[currentTextIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Escribiendo
        setCurrentText(text.substring(0, currentText.length + 1));

        if (currentText === text) {
          setTimeout(() => setIsDeleting(true), delay);
        }
      } else {
        // Borrando
        setCurrentText(text.substring(0, currentText.length - 1));

        if (currentText === '') {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [currentText, currentTextIndex, isDeleting, texts, speed, delay]);

  return (
    <span className={cn('font-mono', className)}>
      {currentText}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}
