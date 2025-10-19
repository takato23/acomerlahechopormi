export interface FeatureFlagsConfig {
  aiSuggestions: boolean;
}

function booleanFromEnv(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return defaultValue;
}

export const featureFlags: FeatureFlagsConfig = {
  aiSuggestions: booleanFromEnv(import.meta.env.VITE_ENABLE_AI_SUGGESTIONS, false),
};

export type FeatureFlagKey = keyof FeatureFlagsConfig;

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag];
}
