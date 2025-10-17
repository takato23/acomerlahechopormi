import { Skeleton } from '@/components/ui/skeleton';

export const ShoppingListContentSkeleton = () => {
  return (
    <div className="flex flex-col gap-4" data-testid="shopping-list-content-skeleton" aria-hidden="true">
      <div className="grid gap-3 md:grid-cols-4 md:items-end">
        <div className="md:col-span-2 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="md:col-span-4 flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="space-y-4 rounded-lg border border-border/40 bg-card/60 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-md border border-border/40 bg-background/40 p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton asChild key={index} className="block h-9 w-full rounded-md">
                <span />
              </Skeleton>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-dashed border-border/50 p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton asChild key={index} className="block h-8 w-full rounded">
              <span />
            </Skeleton>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
};
