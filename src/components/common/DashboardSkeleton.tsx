import type { PropsWithChildren } from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';

export const DashboardSkeleton = ({ children }: PropsWithChildren) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText width="w-48" height="h-8" />
        <SkeletonText width="w-64" height="h-4" />
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SkeletonText width="w-24" height="h-5" />
              <Skeleton variant="circular" width="w-8" height="h-8" />
            </div>
            <SkeletonText width="w-16" height="h-8" />
            <SkeletonText width="w-32" height="h-4" className="mt-1" />
          </SkeletonCard>
        ))}
      </div>

      {/* Gráficos y listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="p-6">
          <SkeletonText width="w-32" height="h-6" className="mb-4" />
          <Skeleton variant="rectangular" width="w-full" height="h-64" />
        </SkeletonCard>

        <SkeletonCard className="p-6">
          <SkeletonText width="w-28" height="h-6" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton variant="circular" width="w-8" height="h-8" />
                <div className="flex-1 space-y-1">
                  <SkeletonText width="w-32" height="h-4" />
                  <SkeletonText width="w-20" height="h-3" />
                </div>
                <SkeletonText width="w-12" height="h-4" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {children}
    </div>
  );
};
