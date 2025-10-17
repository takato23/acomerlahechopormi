import * as Sentry from '@sentry/react';
import type { SeverityLevel, User } from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

type TraceSampleRate = number;

interface ErrorTrackingConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: TraceSampleRate;
}

const DEFAULT_TRACE_SAMPLE_RATE = 0.1;
let initialized = false;
let sentryEnabled = false;

type EnvValue = string | boolean | undefined;

const getBaseRuntimeEnv = (): Record<string, EnvValue> => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env as Record<string, EnvValue>;
  }

  const globalEnv = (globalThis as unknown as {
    __VITE_RUNTIME_ENV__?: Record<string, EnvValue>;
  }).__VITE_RUNTIME_ENV__;

  return globalEnv ?? {};
};

let runtimeEnv: Record<string, EnvValue> = { ...getBaseRuntimeEnv() };

export const setRuntimeEnv = (env: Record<string, EnvValue>) => {
  runtimeEnv = { ...getBaseRuntimeEnv(), ...env };

  if (typeof window !== 'undefined') {
    (globalThis as unknown as { __VITE_RUNTIME_ENV__?: Record<string, EnvValue> }).__VITE_RUNTIME_ENV__ = {
      ...runtimeEnv,
    };
  }
};

const getEnvString = (key: string): string | undefined => {
  const value = runtimeEnv[key];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return undefined;
};

const getEnvBoolean = (key: string): boolean => {
  const value = runtimeEnv[key];
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value === 'true';
  }
  return false;
};

const isTestEnv = () => getEnvString('NODE_ENV') === 'test';

const isDevelopmentEnv = (): boolean =>
  getEnvBoolean('DEV') ||
  getEnvString('MODE') === 'development' ||
  getEnvString('NODE_ENV') === 'development' ||
  isTestEnv();

const parseSampleRate = (
  candidate: string | undefined,
  fallback: TraceSampleRate
): TraceSampleRate => {
  if (!candidate) return fallback;

  const parsed = Number(candidate);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
    return parsed;
  }

  if (isDevelopmentEnv()) {
    console.warn(
      `[errorTracking] Invalid sample rate "${candidate}". Using fallback ${fallback}.`
    );
  }

  return fallback;
};

const getConfig = (): ErrorTrackingConfig | null => {
  const dsn = getEnvString('VITE_SENTRY_DSN');

  if (!dsn) {
    if (isDevelopmentEnv()) {
      console.info('[errorTracking] VITE_SENTRY_DSN is not defined. Skipping Sentry init.');
    }
    return null;
  }

  return {
    dsn,
    environment: getEnvString('VITE_SENTRY_ENVIRONMENT') ?? getEnvString('MODE') ?? 'development',
    release: getEnvString('VITE_SENTRY_RELEASE') ?? getEnvString('VITE_APP_VERSION'),
    tracesSampleRate: parseSampleRate(
      getEnvString('VITE_SENTRY_TRACES_SAMPLE_RATE'),
      DEFAULT_TRACE_SAMPLE_RATE
    ),
  };
};

export const initErrorTracking = (): void => {
  if (initialized) {
    return;
  }

  const config = getConfig();

  if (!config) {
    initialized = true;
    sentryEnabled = false;
    return;
  }

  const integrations: unknown[] = [];

  if (config.tracesSampleRate > 0) {
    integrations.push(
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      })
    );
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    integrations: (existing = []) => [...existing, ...(integrations as typeof existing)],
    tracesSampleRate: config.tracesSampleRate,
    sendClientReports: true,
    debug: isDevelopmentEnv(),
  });

  initialized = true;
  sentryEnabled = true;

  if (isDevelopmentEnv()) {
    console.info('[errorTracking] Sentry initialized with environment:', config.environment);
  }
};

export const isErrorTrackingEnabled = (): boolean => sentryEnabled;

interface CaptureOptions {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: User;
  level?: SeverityLevel;
  contexts?: Record<string, Record<string, unknown>>;
}

const applyCaptureOptions = (scope: Sentry.Scope, options?: CaptureOptions) => {
  if (!options) return;

  if (options.tags) {
    Object.entries(options.tags).forEach(([key, value]) => scope.setTag(key, value));
  }

  if (options.extra) {
    Object.entries(options.extra).forEach(([key, value]) => scope.setExtra(key, value));
  }

  if (options.contexts) {
    Object.entries(options.contexts).forEach(([key, value]) => scope.setContext(key, value));
  }

  if (options.user) {
    scope.setUser(options.user);
  }

  if (options.level) {
    scope.setLevel(options.level);
  }
};

export const captureException = (
  error: unknown,
  options?: CaptureOptions
): string | undefined => {
  if (!sentryEnabled) {
    return;
  }

  let eventId: string | undefined;

  Sentry.withScope((scope) => {
    applyCaptureOptions(scope, options);
    eventId = Sentry.captureException(error);
  });

  return eventId;
};

export const captureMessage = (
  message: string,
  options?: CaptureOptions
): string | undefined => {
  if (!sentryEnabled) {
    return;
  }

  let eventId: string | undefined;

  Sentry.withScope((scope) => {
    applyCaptureOptions(scope, options);
    eventId = Sentry.captureMessage(message, options?.level);
  });

  return eventId;
};

export const setUser = (user: User | null): void => {
  if (!sentryEnabled) {
    return;
  }

  Sentry.setUser(user ?? null);
};

export const setTag = (key: string, value: string): void => {
  if (!sentryEnabled) {
    return;
  }

  Sentry.setTag(key, value);
};

export const setContext = (name: string, context: Record<string, unknown>): void => {
  if (!sentryEnabled) {
    return;
  }

  Sentry.setContext(name, context);
};

export const withProfiler = Sentry.withProfiler;

declare global {
  interface Window {
    __A_COMERLA_THROW_TEST_ERROR__?: () => void;
    __A_COMERLA_CAPTURE_SENTRY_EVENT__?: () => void;
  }
}

if (isDevelopmentEnv()) {
  window.__A_COMERLA_THROW_TEST_ERROR__ = () => {
    throw new Error('Error simulado para probar ErrorBoundary y Sentry');
  };

  window.__A_COMERLA_CAPTURE_SENTRY_EVENT__ = () => {
    captureMessage('Evento de prueba manual desde la consola', { level: 'info' });
  };
}
