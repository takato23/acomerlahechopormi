import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageHeader } from './PageHeader';

type PageHeaderProps = React.ComponentProps<typeof PageHeader>;

interface PageSectionProps extends Partial<PageHeaderProps> {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  padded?: boolean;
  headerClassName?: string;
}

export function PageSection({
  title,
  description,
  icon,
  actions,
  children,
  className,
  contentClassName,
  padded = true,
  headerClassName,
}: PageSectionProps) {
  const hasHeaderContent = title || description || icon || actions;

  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/95',
        className,
      )}
    >
      {hasHeaderContent && (
        <div
          className={cn(
            'flex flex-col gap-section-sm border-b border-border sm:flex-row sm:items-center sm:justify-between',
            padded ? 'px-section py-section' : 'px-section py-section-sm',
            headerClassName,
          )}
        >
          <PageHeader title={title} description={description} icon={icon} />
          {actions && <div className="flex flex-wrap items-center gap-section-sm">{actions}</div>}
        </div>
      )}

      <div
        className={cn(
          'flex flex-col',
          padded ? 'px-section py-section' : undefined,
          padded ? 'gap-section' : 'gap-section-sm',
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
