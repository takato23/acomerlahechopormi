import { Skeleton } from '@/components/ui/skeleton';

export const PantrySkeleton = () => {
  return (
    <div className="space-y-4" data-testid="pantry-skeleton" aria-hidden="true">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-7 w-40 md:w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, categoryIndex) => (
        <div key={categoryIndex} className="rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm">
          <Skeleton className="mb-3 h-5 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((__, itemIndex) => (
              <div key={itemIndex} className="flex items-start gap-3 rounded-md border border-border/40 bg-background/40 p-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
