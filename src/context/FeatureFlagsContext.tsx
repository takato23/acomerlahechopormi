import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { initialize, type LDClient, type LDUser } from 'launchdarkly-js-client-sdk';
import { useAuth } from '@/features/auth/AuthContext';

interface FeatureFlagsContextValue {
  ready: boolean;
  visionPipelineEnabled: boolean;
  dashboardPastelEnabled: boolean;
  client: LDClient | null;
  track: (event: string, data?: unknown) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  ready: true,
  visionPipelineEnabled: true,
  dashboardPastelEnabled: false,
  client: null,
  track: () => undefined,
});

const buildLdUser = (user: ReturnType<typeof useAuth>['user']): LDUser => {
  if (!user) {
    return {
      key: 'anonymous',
      anonymous: true,
    };
  }

  const metadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const custom: Record<string, string | number | boolean> = {};
  if (typeof metadata.plan === 'string') {
    custom.plan = metadata.plan;
  }
  if (typeof metadata.beta === 'boolean') {
    custom.beta = metadata.beta;
  }
  if (typeof user.created_at === 'string') {
    custom.createdAt = user.created_at;
  }

  return {
    key: user.id,
    anonymous: false,
    email: user.email ?? undefined,
    custom: Object.keys(custom).length > 0 ? custom : undefined,
  };
};

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const { user } = useAuth();
  const clientKey = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_KEY;
  const clientRef = useRef<LDClient | null>(null);
  const [ready, setReady] = useState<boolean>(typeof window === 'undefined' || !clientKey);
  const [visionEnabled, setVisionEnabled] = useState<boolean>(true);
  const [dashboardPastelEnabled, setDashboardPastelEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!clientKey) {
      setReady(true);
      setVisionEnabled(true);
      setDashboardPastelEnabled(false);
      return;
    }
    if (clientRef.current) return;

    const ldClient = initialize(clientKey, buildLdUser(null), {
      bootstrap: 'localStorage',
    });

    clientRef.current = ldClient;
    setReady(false);

    const handleReady = () => {
      setReady(true);
      setVisionEnabled(ldClient.variation('vision_pipeline_enabled', true));
      setDashboardPastelEnabled(ldClient.variation('dashboard_pastel', false));
    };

    const handleVisionChange = (enabled: boolean) => {
      setVisionEnabled(Boolean(enabled));
    };

    const handleDashboardPastelChange = (enabled: boolean) => {
      setDashboardPastelEnabled(Boolean(enabled));
    };

    ldClient.on('ready', handleReady);
    ldClient.on('change:vision_pipeline_enabled', handleVisionChange);
    ldClient.on('change:dashboard_pastel', handleDashboardPastelChange);

    ldClient.waitForInitialization().catch((error) => {
      console.warn('[FeatureFlags] LaunchDarkly initialization failed', error);
      setReady(true);
      setVisionEnabled(true);
      setDashboardPastelEnabled(false);
    });

    return () => {
      ldClient.off('ready', handleReady);
      ldClient.off('change:vision_pipeline_enabled', handleVisionChange);
      ldClient.off('change:dashboard_pastel', handleDashboardPastelChange);
      ldClient.close();
      clientRef.current = null;
    };
  }, [clientKey]);

  useEffect(() => {
    const ldClient = clientRef.current;
    if (!ldClient) return;

    const ldUser = buildLdUser(user);
    ldClient.identify(ldUser).catch((error) => {
      console.warn('[FeatureFlags] Unable to identify LaunchDarkly user', error);
    });
  }, [user]);

  const value = useMemo<FeatureFlagsContextValue>(() => ({
    ready,
    visionPipelineEnabled: visionEnabled,
    dashboardPastelEnabled,
    client: clientRef.current,
    track: (event: string, data?: unknown) => {
      clientRef.current?.track(event, data);
    },
  }), [ready, visionEnabled, dashboardPastelEnabled]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export const useFeatureFlags = () => useContext(FeatureFlagsContext);
