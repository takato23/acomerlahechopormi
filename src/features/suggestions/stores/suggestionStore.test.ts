import { act } from '@testing-library/react';
import { useSuggestionStore } from './suggestionStore';
import type { SuggestionRequest } from '../types';

jest.mock('../services/suggestionService', () => ({
  suggestionService: {
    getSuggestions: jest.fn(),
  },
}));

jest.mock('@/lib/notifications', () => ({
  notifySuccess: jest.fn(),
  notifyInfo: jest.fn(),
  notifyError: jest.fn(),
}));

const { suggestionService } = jest.requireMock('../services/suggestionService');
const { notifySuccess, notifyInfo, notifyError } = jest.requireMock('@/lib/notifications');

const resetStore = () => {
  useSuggestionStore.setState({
    suggestions: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
};

describe('suggestionStore notifications', () => {
  const request: SuggestionRequest = {
    mealType: 'Cena',
    pantryItems: [{ name: 'Tomate', quantity: 2 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('fires success notification when suggestions are returned', async () => {
    suggestionService.getSuggestions.mockResolvedValue({
      suggestions: [{ name: 'Ensalada', description: 'Ligera y rápida' }],
    });

    await act(async () => {
      await useSuggestionStore.getState().getSuggestions(request);
    });

    expect(notifySuccess).toHaveBeenCalledWith(
      'Tenemos nuevas sugerencias para vos',
      expect.any(Object)
    );
    expect(notifyInfo).not.toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('fires info notification when no suggestions exist', async () => {
    suggestionService.getSuggestions.mockResolvedValue({
      suggestions: [],
    });

    await act(async () => {
      await useSuggestionStore.getState().getSuggestions(request);
    });

    expect(notifyInfo).toHaveBeenCalledWith(
      'No encontramos sugerencias nuevas',
      expect.any(Object)
    );
    expect(notifySuccess).not.toHaveBeenCalled();
  });

  it('fires error notification when service fails', async () => {
    suggestionService.getSuggestions.mockResolvedValue({
      error: 'Service unavailable',
      suggestions: [],
    });

    await act(async () => {
      await useSuggestionStore.getState().getSuggestions(request);
    });

    expect(notifyError).toHaveBeenCalledWith(
      'No pudimos generar nuevas sugerencias',
      expect.objectContaining({ description: 'Service unavailable' })
    );
  });
});
