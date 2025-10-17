import posthog from 'posthog-js';
import { setAnalyticsClient } from './analytics';

let initialized = false;

const getPosthogKey = () => import.meta.env.VITE_POSTHOG_KEY;
const getPosthogHost = () => import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com';

export const initPosthog = () => {
  if (initialized || typeof window === 'undefined') {
    return posthog;
  }

  const apiKey = getPosthogKey();
  if (!apiKey) {
    initialized = true;
    return posthog;
  }

  posthog.init(apiKey, {
    api_host: getPosthogHost(),
    capture_pageview: false,
    persistence: 'localStorage',
    sanitize_properties: (properties) => ({
      ...properties,
      // Avoid leaking large payloads accidentally
      metadata: undefined,
    }),
    loaded: (client) => {
      setAnalyticsClient((event, props) => {
        client.capture(event, props);
      });
    },
  });

  initialized = true;
  return posthog;
};

export const getPosthog = () => posthog;

export const identifyPosthogUser = (id: string, traits?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  if (!initialized) {
    initPosthog();
  }
  if (!getPosthogKey()) return;
  posthog.identify(id, traits);
};

export const resetPosthog = () => {
  if (typeof window === 'undefined') return;
  if (!initialized || !getPosthogKey()) return;
  posthog.reset();
};
