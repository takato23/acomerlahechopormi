import { clsx } from 'clsx';
import type { CSSProperties, ReactNode } from 'react';

export type SkeletonVariant =
  | 'text'
  | 'rectangular'
  | 'circular'
  | 'rounded'
  | 'card'
  | 'list-item'
  | 'avatar';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // Para variant='text', número de líneas
  animated?: boolean;
  children?: ReactNode;
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className,
  lines = 1,
  animated = true,
  children,
}: SkeletonProps) => {
  const baseClasses = clsx(
    'bg-gray-200',
    animated && 'animate-pulse',
    className
  );

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return lines === 1
          ? 'h-4 w-full'
          : 'space-y-2';
      case 'rectangular':
        return 'w-full h-32';
      case 'circular':
        return 'rounded-full aspect-square';
      case 'rounded':
        return 'rounded-lg';
      case 'card':
        return 'rounded-lg p-4 space-y-3';
      case 'list-item':
        return 'flex items-center space-x-3 p-3';
      case 'avatar':
        return 'rounded-full aspect-square';
      default:
        return 'h-4 w-full';
    }
  };

  const getVariantStyles = () => {
    const styles: CSSProperties = {};

    if (width !== undefined) {
      styles.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height !== undefined) {
      styles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return styles;
  };

  const variantClasses = getVariantClasses();
  const variantStyles = getVariantStyles();

  if (children) {
    return (
      <div className={clsx(baseClasses, variantClasses)} style={variantStyles}>
        {children}
      </div>
    );
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx(baseClasses, variantClasses)} style={variantStyles}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'h-4 bg-gray-200',
              animated && 'animate-pulse',
              index === lines - 1 ? 'w-3/4' : 'w-full' // Última línea más corta
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(baseClasses, variantClasses)}
      style={variantStyles}
    />
  );
};

// Componentes específicos preconfigurados
export const SkeletonText = (props: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton {...props} variant="text" />
);

export const SkeletonCard = (props: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton {...props} variant="card" />
);

export const SkeletonAvatar = (props: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton {...props} variant="avatar" />
);

export const SkeletonButton = ({
  width = 'w-24',
  height = 'h-10',
  className,
  animated = true,
}: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton
    variant="rounded"
    width={width}
    height={height}
    className={clsx('rounded-md', className)}
    animated={animated}
  />
);
