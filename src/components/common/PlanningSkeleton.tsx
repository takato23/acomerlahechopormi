import type { PropsWithChildren } from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';

export const PlanningSkeleton = ({ children }: PropsWithChildren) => {
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width="w-10" height="h-10" />
          <div className="space-y-1">
            <SkeletonText width="w-32" height="h-6" />
            <SkeletonText width="w-24" height="h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" width="w-20" height="h-10" />
          <Skeleton variant="rounded" width="w-24" height="h-10" />
          <Skeleton variant="rounded" width="w-28" height="h-10" />
        </div>
      </div>

      {/* Navegación de semanas */}
      <div className="flex items-center justify-between">
        <Skeleton variant="rounded" width="w-32" height="h-10" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width="w-8" height="h-8" />
          <SkeletonText width="w-16" height="h-5" />
          <Skeleton variant="circular" width="w-8" height="h-8" />
        </div>
        <Skeleton variant="rounded" width="w-32" height="h-10" />
      </div>

      {/* Vista de semana - skeleton de tarjetas de días */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <SkeletonCard key={dayIndex} className="p-4">
            <div className="space-y-3">
              {/* Día de la semana */}
              <SkeletonText width="w-16" height="h-5" />

              {/* Meals del día */}
              {Array.from({ length: 3 }).map((_, mealIndex) => (
                <div key={mealIndex} className="space-y-2">
                  <SkeletonText width="w-20" height="h-4" />
                  <SkeletonCard className="p-3">
                    <div className="flex items-center gap-2">
                      <Skeleton variant="circular" width="w-8" height="h-8" />
                      <div className="flex-1 space-y-1">
                        <SkeletonText width="w-24" height="h-4" />
                        <SkeletonText width="w-16" height="h-3" />
                      </div>
                    </div>
                  </SkeletonCard>
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Panel de Vision Upload */}
      <div className="lg:sticky lg:top-12">
        <SkeletonCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SkeletonText width="w-48" height="h-6" />
                <SkeletonText width="w-64" height="h-4" />
              </div>
              <Skeleton variant="circular" width="w-6" height="h-6" />
            </div>

            {/* Área de drop */}
            <SkeletonCard className="p-10">
              <div className="text-center space-y-3">
                <Skeleton variant="circular" width="w-12" height="h-12" className="mx-auto" />
                <SkeletonText width="w-48" height="h-5" className="mx-auto" />
                <SkeletonText width="w-56" height="h-4" className="mx-auto" />
              </div>
            </SkeletonCard>

            {/* Métricas */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
              <SkeletonText width="w-20" height="h-4" />
              <SkeletonText width="w-16" height="h-4" />
              <SkeletonText width="w-18" height="h-4" />
            </div>
          </div>
        </SkeletonCard>
      </div>

      {children}
    </div>
  );
};
