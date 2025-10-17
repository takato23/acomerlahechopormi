import type { PropsWithChildren } from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';

export const PantrySkeleton = ({ children }: PropsWithChildren) => {
  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonText width="w-48" height="h-8" />
          <div className="flex gap-2">
            <Skeleton variant="rounded" width="w-10" height="h-10" />
            <Skeleton variant="rounded" width="w-10" height="h-10" />
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard className="p-4">
            <SkeletonText width="w-20" height="h-4" className="mb-2" />
            <Skeleton variant="rounded" width="w-full" height="h-10" />
          </SkeletonCard>
          <SkeletonCard className="p-4">
            <SkeletonText width="w-16" height="h-4" className="mb-2" />
            <Skeleton variant="rounded" width="w-full" height="h-10" />
          </SkeletonCard>
          <SkeletonCard className="p-4">
            <SkeletonText width="w-24" height="h-4" className="mb-2" />
            <Skeleton variant="rounded" width="w-full" height="h-10" />
          </SkeletonCard>
        </div>

        {/* Input de agregar items */}
        <SkeletonCard className="p-4">
          <SkeletonText width="w-32" height="h-5" className="mb-3" />
          <div className="flex gap-2">
            <Skeleton variant="rounded" width="w-full" height="h-12" />
            <Skeleton variant="rounded" width="w-24" height="h-12" />
          </div>
        </SkeletonCard>
      </div>

      {/* Grid de items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton variant="circular" width="w-12" height="h-12" />
              <div className="flex-1 space-y-2">
                <SkeletonText width="w-24" height="h-5" />
                <SkeletonText width="w-16" height="h-4" />
                <SkeletonText width="w-20" height="h-4" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <SkeletonText width="w-12" height="h-4" />
              <Skeleton variant="rounded" width="w-8" height="h-8" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {children}
    </div>
  );
};
