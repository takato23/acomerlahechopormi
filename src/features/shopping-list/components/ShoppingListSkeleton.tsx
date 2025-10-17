import { Skeleton } from '@/components/ui/skeleton';

export const ShoppingListSkeleton = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" aria-hidden="true">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`shopping-item-skeleton-${index}`}
            className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    </div>
  );
};
