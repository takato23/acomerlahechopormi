import posthog from 'posthog-js';

type AnalyticsClient = typeof posthog;
type Properties = Record<string, unknown>;

declare global {
  interface Window {
    __analyticsInitialized?: boolean;
  }
}

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com';
const ANALYTICS_DISABLED = (import.meta.env.VITE_ANALYTICS_DISABLED ?? '').toString().toLowerCase() === 'true';

let initialized = false;
let client: AnalyticsClient | null = null;

const isBrowser = typeof window !== 'undefined';

const shouldSkipAnalytics = () => {
  if (!isBrowser) return true;
  if (ANALYTICS_DISABLED) return true;
  if (!POSTHOG_KEY) return true;
  if (import.meta.env.MODE === 'test') return true;
  return false;
};

const setupGlobalHandlers = () => {
  if (!isBrowser || window.__analyticsInitialized) return;

  window.addEventListener('error', (event) => {
    captureEvent('js_error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureEvent('promise_rejection', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'unknown'),
    });
  });

  if ('performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const paint = performance.getEntriesByType('paint') as PerformanceEntry[];

      if (navigation) {
        captureEvent('performance_metrics', {
          domContentLoaded: navigation.domContentLoadedEventEnd,
          loadTime: navigation.loadEventEnd,
          type: navigation.type,
        });
      }

      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');
      if (fcp) {
        captureEvent('first_contentful_paint', {
          value: fcp.startTime,
        });
      }
    });
  }

  window.__analyticsInitialized = true;
};

export const initializeAnalytics = (): AnalyticsClient | null => {
  if (initialized) {
    return client;
  }

  if (shouldSkipAnalytics()) {
    if (import.meta.env.DEV) {
      console.info('[analytics] Telemetría desactivada.');
    }
    return null;
  }

  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: false,
    persistence: 'localStorage',
    autocapture: false,
  });

  client = posthog;
  initialized = true;

  setupGlobalHandlers();
  captureEvent('app_loaded', {
    environment: import.meta.env.MODE,
    timestamp: new Date().toISOString(),
  });

  return client;
};

export const captureEvent = (eventName: string, properties?: Properties) => {
  const analytics = initialized ? client : initializeAnalytics();
  analytics?.capture(eventName, properties);
};

export const identifyUser = (userId: string, properties?: Properties) => {
  const analytics = initialized ? client : initializeAnalytics();
  analytics?.identify(userId, properties);
};

export const resetUser = () => {
  if (!initialized || !client) return;
  client.reset();
};

export const getAnalyticsClient = () => (initialized ? client : null);
