import { Skeleton } from '@/components/ui/skeleton';

export const FavoriteRecipesWidgetSkeleton = () => {
  return (
    <div className="flex h-full flex-col gap-3" data-testid="favorite-recipes-skeleton" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 p-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton asChild className="h-4 flex-1 rounded-md">
              <span />
            </Skeleton>
          </div>
        ))}
      </div>
    </div>
  );
};
