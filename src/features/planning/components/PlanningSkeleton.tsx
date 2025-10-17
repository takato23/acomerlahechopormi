import { Skeleton } from '@/components/ui/skeleton';

export const PlanningSkeleton = () => {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={`planning-day-skeleton-${index}`}
            className="flex min-h-[520px] flex-col rounded-2xl border border-border/40 bg-card/50 p-4 shadow-sm"
          >
            <div className="mb-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="mb-6 space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <div className="flex-1 space-y-3">
              {Array.from({ length: 3 }).map((__, mealIndex) => (
                <div key={`planning-meal-skeleton-${index}-${mealIndex}`} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
