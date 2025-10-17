import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import React from 'react';

jest.mock('@/lib/errorHandler', () => ({
  handleError: jest.fn(),
}));

const ThrowError: React.FC = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    jest.clearAllMocks();
  });

  it('renders the fallback UI when an error is thrown', () => {
    render(
      <ErrorBoundary name="test-boundary">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('¡Ups! Algo salió mal')).toBeInTheDocument();

    const mockedHandleError = require('@/lib/errorHandler').handleError as jest.Mock;
    expect(mockedHandleError).toHaveBeenCalled();

    const callArgs = mockedHandleError.mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(Error);
    expect(callArgs[1]).toMatchObject({ severity: 'critical', component: 'test-boundary' });
    expect(callArgs[2]).toMatchObject({ skipCapture: true });
  });
});
