import { useFeatureFlags } from '@/context/FeatureFlagsContext';

export const useFeatureFlag = (flagName: keyof Pick<ReturnType<typeof useFeatureFlags>, 'visionPipelineEnabled' | 'dashboardPastelEnabled'>) => {
  const flags = useFeatureFlags();

  // TEMPORAL: Forzar dashboard pastel habilitado para testing
  if (flagName === 'dashboardPastelEnabled') {
    return true;
  }

  return flags[flagName];
};
