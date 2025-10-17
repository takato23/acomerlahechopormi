import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`dashboard-widget-skeleton-${index}`}
            className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm"
          >
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="mt-6 h-10 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
};
