type AnalyticsEventProps = Record<string, unknown>;

type AnalyticsClient = (event: string, props?: AnalyticsEventProps) => void;

let client: AnalyticsClient | null = null;

const isTestEnvironment = () =>
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

export function setAnalyticsClient(analyticsClient: AnalyticsClient | null) {
  client = analyticsClient;
}

export function track(event: string, props?: AnalyticsEventProps) {
  const payload = props ? { ...props } : undefined;

  if (client) {
    client(event, payload);
    return;
  }

  if (!isTestEnvironment()) {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${event}`, payload ?? {});
  }
}

export function trackOnboardingStepView(step: string, metadata?: AnalyticsEventProps) {
  track('onboarding_step_view', { step, ...metadata });
}

export function trackOnboardingStepCompleted(step: string, metadata?: AnalyticsEventProps) {
  track('onboarding_step_completed', { step, ...metadata });
}

export function trackOnboardingCompleted(metadata?: AnalyticsEventProps) {
  track('onboarding_completed', metadata);
}

export function trackPlanningGenerationStarted(metadata?: AnalyticsEventProps) {
  track('planning_generation_started', metadata);
}

export function trackPlanningGenerationCompleted(metadata?: AnalyticsEventProps) {
  track('planning_generation_completed', metadata);
}

export function trackPlanningGenerationFailed(metadata?: AnalyticsEventProps) {
  track('planning_generation_failed', metadata);
}

export function trackShoppingListGenerated(metadata?: AnalyticsEventProps) {
  track('shopping_list_generated', metadata);
}
