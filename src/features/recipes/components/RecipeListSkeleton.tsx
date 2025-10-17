import { Skeleton } from '@/components/ui/skeleton';

export const RecipeListSkeleton = () => {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-56" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`recipe-card-skeleton-${index}`}
            className="rounded-2xl border border-border/50 bg-card/60 p-4 shadow-sm"
          >
            <Skeleton className="mb-4 h-48 w-full rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
