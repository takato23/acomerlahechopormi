import { ensureRecipeHasImage } from './generationService';
import type { GeneratedRecipeData } from '@/types/recipeTypes';
import { recipeImageProvider } from '@/features/planning/services/recipeImageProvider';

jest.mock('@/features/planning/services/recipeImageProvider', () => ({
  recipeImageProvider: {
    getImageUrl: jest.fn(),
  },
}));

const mockedRecipeImageProvider = recipeImageProvider as jest.Mocked<typeof recipeImageProvider>;

const buildRecipe = (overrides: Partial<GeneratedRecipeData> = {}): GeneratedRecipeData => ({
  title: 'Receta de prueba',
  description: 'Descripción de prueba',
  ingredients: [
    { name: 'Tomate', quantity: 2, unit: 'u' },
    { name: 'Pollo', quantity: 200, unit: 'g' },
  ],
  instructions: ['Paso 1', 'Paso 2'],
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  servings: 4,
  ...overrides,
});

describe('ensureRecipeHasImage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the recipe unchanged when an image already exists', async () => {
    const recipe = buildRecipe({ imageUrl: 'https://example.com/image.jpg' });

    const result = await ensureRecipeHasImage(recipe);

    expect(mockedRecipeImageProvider.getImageUrl).not.toHaveBeenCalled();
    expect(result).toBe(recipe);
    expect(result.imageUrl).toBe('https://example.com/image.jpg');
  });

  it('fetches an image when none is provided', async () => {
    const recipe = buildRecipe({ imageUrl: null });
    mockedRecipeImageProvider.getImageUrl.mockResolvedValue('https://images.test/recipe.jpg');

    const result = await ensureRecipeHasImage(recipe);

    expect(mockedRecipeImageProvider.getImageUrl).toHaveBeenCalledWith({
      title: 'Receta de prueba',
      ingredients: ['Tomate', 'Pollo'],
    });
    expect(result.imageUrl).toBe('https://images.test/recipe.jpg');
  });

  it('silently keeps the recipe without image when providers fail', async () => {
    const recipe = buildRecipe({ imageUrl: null });
    mockedRecipeImageProvider.getImageUrl.mockRejectedValue(new Error('network error'));

    const result = await ensureRecipeHasImage(recipe);

    expect(mockedRecipeImageProvider.getImageUrl).toHaveBeenCalled();
    expect(result.imageUrl).toBeNull();
  });
});
