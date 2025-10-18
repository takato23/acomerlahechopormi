import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start gap-section-sm', className)}>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div>
        {title && <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>}
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}