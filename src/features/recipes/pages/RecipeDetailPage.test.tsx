import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RecipeDetailPage from './RecipeDetailPage';

jest.mock('@/lib/notifications', () => ({
  notifyAsync: jest.fn(),
  notifyError: jest.fn(),
  notifyInfo: jest.fn(),
}));

jest.mock('@/features/recipes/services/recipeService', () => ({
  getRecipeById: jest.fn(),
  deleteRecipe: jest.fn(),
}));

jest.mock('@/features/recipes/generationService', () => ({
  generateRecipeVariation: jest.fn(),
}));

jest.mock('@/features/shopping-list/shoppingListService', () => ({
  addShoppingListItem: jest.fn(),
}));

jest.mock('@/stores/recipeStore', () => ({
  useRecipeStore: (selector: (state: { removeRecipe: () => void }) => unknown) =>
    selector({ removeRecipe: jest.fn() }),
}));

const { getRecipeById } = jest.requireMock('@/features/recipes/services/recipeService');
const { addShoppingListItem } = jest.requireMock(
  '@/features/shopping-list/shoppingListService'
);
const { notifyAsync: mockNotifyAsync } = jest.requireMock('@/lib/notifications');

describe('RecipeDetailPage notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getRecipeById.mockResolvedValue({
      id: 'recipe-1',
      title: 'Sopa de Tomate',
      description: 'Reconfortante',
      image_url: null,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      servings: 4,
      ingredients: [
        { ingredient_name: 'Tomate', quantity: 3, unit: 'u' },
        { ingredient_name: 'Agua', quantity: null, unit: null },
      ],
      instructions: ['Picar tomates', 'Cocinar'],
      tags: [],
    });

    addShoppingListItem.mockResolvedValue(undefined);
  });

  it('dispatches async notification when adding ingredients to the shopping list', async () => {
    render(
      <MemoryRouter initialEntries={['/app/recipes/recipe-1']}>
        <Routes>
          <Route path="/app/recipes/:recipeId" element={<RecipeDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    const addButton = await screen.findByRole('button', { name: /Añadir a Lista/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockNotifyAsync).toHaveBeenCalled();
    });

    const [, messages] = mockNotifyAsync.mock.calls[0];
    expect(messages).toEqual({
      loading: 'Añadimos los ingredientes de la receta a tu lista...',
      success: 'Añadimos los ingredientes de la receta a tu lista de compras.',
      error: 'No pudimos agregar los ingredientes. Inténtalo nuevamente.',
    });

    await waitFor(() => {
      expect(addShoppingListItem).toHaveBeenCalledWith({
        name: 'Tomate',
        quantity: 3,
        unit: 'u',
      });
    });
  });
});
