import { track, setAnalyticsClient, trackOnboardingStepView, trackPlanningGenerationFailed } from './analytics';

describe('analytics wrapper', () => {
  afterEach(() => {
    setAnalyticsClient(null);
  });

  it('falls back to console when no client provided', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    track('test_event', { foo: 'bar' });
    expect(spy).toHaveBeenCalledWith('[analytics] test_event', { foo: 'bar' });
    process.env.NODE_ENV = previousEnv;
    spy.mockRestore();
  });

  it('delegates to custom client', () => {
    const mockClient = jest.fn();
    setAnalyticsClient(mockClient);
    trackOnboardingStepView('primaryGoal');
    expect(mockClient).toHaveBeenCalledWith('onboarding_step_view', { step: 'primaryGoal' });
  });

  it('supports metadata forwarding', () => {
    const mockClient = jest.fn();
    setAnalyticsClient(mockClient);
    trackPlanningGenerationFailed({ reason: 'timeout' });
    expect(mockClient).toHaveBeenCalledWith('planning_generation_failed', { reason: 'timeout' });
  });
});
