jest.mock('@/lib/supabaseClient', () => {
  const mockFrom = jest.fn();
  const mockGetUser = jest.fn();
  const mockStorageFrom = jest.fn();

  return {
    supabase: {
      auth: { getUser: mockGetUser },
      from: mockFrom,
      storage: { from: mockStorageFrom }
    },
    mockFrom,
    mockGetUser,
    mockStorageFrom
  };
});

const { mockFrom, mockGetUser, mockStorageFrom } = jest.requireMock('@/lib/supabaseClient');

import { getUserProfile, updateUserProfile, uploadAvatar } from './userService';

describe('userService', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockGetUser.mockReset();
    mockStorageFrom.mockReset();
  });

  describe('getUserProfile', () => {
    it('returns a mapped profile when Supabase responds correctly', async () => {
      const profileRow = {
        id: 'user-123',
        username: 'chef',
        avatar_url: 'https://cdn/avatar.png',
        gemini_api_key: 'secret',
        cuisine_preferences: ['italiana', 'mexicana'],
        dietary_restrictions: ['vegetariano'],
        disliked_ingredients: ['cebolla'],
        preferred_meal_times: { breakfast: '0800', dinner: '2100' },
        max_calories: 2000,
        household_size: 4,
        onboarding_completed_at: '2025-10-01T10:00:00Z',
        objectives: { primaryGoal: 'save_time', weeklySavingsTarget: 20 },
        cooking_skill_level: 'medium',
        created_at: '2025-09-01T00:00:00Z',
        updated_at: '2025-09-10T00:00:00Z'
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: profileRow, error: null });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const profile = await getUserProfile('user-123');

      expect(profile).toMatchObject({
        id: 'user-123',
        username: 'chef',
        avatarUrl: 'https://cdn/avatar.png',
        geminiApiKey: 'secret',
        cuisinePreferences: ['italiana', 'mexicana'],
        dietaryRestrictions: ['vegetariano'],
        dislikedIngredients: ['cebolla'],
        preferredMealTimes: { breakfast: '0800', dinner: '2100' },
        maxCalories: 2000,
        householdSize: 4,
        onboardingCompletedAt: '2025-10-01T10:00:00Z'
      });

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledTimes(1);
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockSingle).toHaveBeenCalledTimes(1);
    });

    it('returns null when Supabase reports profile not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementationOnce(() => ({ select: mockSelect }));

      const profile = await getUserProfile('missing-user');

      expect(profile).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('logs and returns null on unexpected error', async () => {
      mockFrom.mockImplementationOnce(() => ({ select: () => { throw new Error('boom'); } }));
      const profile = await getUserProfile('user-err');
      expect(profile).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('maps camelCase fields to snake_case payload', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      const result = await updateUserProfile('user-123', {
        username: 'new-chef',
        avatarUrl: 'https://cdn/new-avatar.png',
        householdSize: 3,
        objectives: { primaryGoal: 'health', weeklySavingsTarget: 10, calorieTarget: 1800 }
      });

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        username: 'new-chef',
        avatar_url: 'https://cdn/new-avatar.png',
        household_size: 3,
        objectives: {
          primaryGoal: 'health',
          weeklySavingsTarget: 10,
          calorieTarget: 1800,
          householdBudget: null
        }
      }));
      expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('returns false when Supabase responds with error', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: new Error('update failed') });
      const mockUpdate = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      const result = await updateUserProfile('user-123', { username: 'oops' });

      expect(result).toBe(false);
    });

    it('returns true without calling Supabase when payload is empty', async () => {
      const result = await updateUserProfile('user-123', {});
      expect(result).toBe(true);
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('uploadAvatar', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    it('uploads avatar and updates profile', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });

      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/avatar.png' } });
      mockStorageFrom.mockReturnValue({ upload: mockUpload, getPublicUrl: mockGetPublicUrl });

      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      const result = await uploadAvatar(file);

      expect(result).toBe('https://cdn/avatar.png');
      expect(mockStorageFrom).toHaveBeenCalledWith('avatars');
      expect(mockUpload).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: 'https://cdn/avatar.png' }));
    });

    it('returns null when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
      const result = await uploadAvatar(file);
      expect(result).toBeNull();
    });

    it('returns null when upload fails', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
      const mockUpload = jest.fn().mockResolvedValue({ error: new Error('upload failed') });
      mockStorageFrom.mockReturnValue({ upload: mockUpload, getPublicUrl: jest.fn() });

      const result = await uploadAvatar(file);
      expect(result).toBeNull();
    });
  });
});
