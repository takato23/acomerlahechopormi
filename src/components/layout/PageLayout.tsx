import { ReactNode } from 'react';
import { PageHeader, PageHeaderProps } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';

const MAX_WIDTH_CLASSNAME: Record<'page' | 'content' | 'full', string> = {
  page: 'max-w-page',
  content: 'max-w-content',
  full: 'max-w-none',
};

export interface PageLayoutProps extends PageHeaderProps {
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_CLASSNAME;
  className?: string;
  contentClassName?: string;
}

export function PageLayout({
  title,
  description,
  icon,
  actions,
  children,
  maxWidth = 'page',
  className,
  contentClassName,
}: PageLayoutProps) {
  const hasHeaderContent = title || description || icon || actions;

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-section px-page-inline py-page-block',
          MAX_WIDTH_CLASSNAME[maxWidth],
          contentClassName,
        )}
      >
        {hasHeaderContent && (
          <div className="flex flex-col gap-section-sm sm:flex-row sm:items-center sm:justify-between">
            <PageHeader title={title} description={description} icon={icon} />
            {actions && <div className="flex flex-wrap items-center gap-section-sm">{actions}</div>}
          </div>
        )}
        <div className="flex flex-col gap-section">{children}</div>
      </div>
    </div>
  );
}
