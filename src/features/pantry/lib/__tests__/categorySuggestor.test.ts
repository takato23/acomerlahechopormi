import { suggestCategory } from '../categorySuggestor';
import { inferCategory } from '@/features/shopping-list/lib/categoryInference';

jest.mock('@/features/shopping-list/lib/categoryInference', () => ({
  inferCategory: jest.fn(),
}));

describe('categorySuggestor', () => {
  const inferCategoryMock = inferCategory as jest.MockedFunction<typeof inferCategory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when item name is empty', async () => {
    await expect(suggestCategory('')).resolves.toBeNull();
    expect(inferCategoryMock).not.toHaveBeenCalled();
  });

  it('delegates to inferCategory for non-empty names', async () => {
    inferCategoryMock.mockResolvedValueOnce('meat');
    await expect(suggestCategory('Pollo')).resolves.toBe('meat');
    expect(inferCategoryMock).toHaveBeenCalledWith('Pollo');
  });

  it('returns null when inference throws', async () => {
    inferCategoryMock.mockRejectedValueOnce(new Error('failed'));
    await expect(suggestCategory('Desconocido')).resolves.toBeNull();
  });
});
