import { getUserProfile, updateUserProfile } from './userService';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient', () => {
  const mockAuth = {
    getUser: jest.fn(),
  };

  const mockFrom = jest.fn();

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    },
  };
});

describe('userService', () => {
  const mockGetUser = supabase.auth.getUser as jest.Mock;
  const mockFrom = supabase.from as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReset();
  });

  describe('getUserProfile', () => {
    it('returns null when there is no authenticated user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await getUserProfile('user-1');

      expect(result).toBeNull();
      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });

    it('returns base profile when profile row is missing', async () => {
      const mockUser = { id: 'user-1', email: 'demo@example.com', user_metadata: {} };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getUserProfile(mockUser.id);

      expect(mockSelect).toHaveBeenCalledWith(
        'id, username, dietary_preference, allergies_restrictions, avatar_url, difficulty_preference, max_prep_time, gemini_api_key, excluded_ingredients, available_equipment'
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          dietary_preference: null,
          excluded_ingredients: [],
        })
      );
    });

    it('merges profile data when available', async () => {
      const mockUser = { id: 'user-2', email: 'demo@example.com', user_metadata: {} };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockProfileRow = {
        id: mockUser.id,
        username: 'chef',
        dietary_preference: 'vegan',
        allergies_restrictions: 'sin frutos secos',
        avatar_url: 'https://cdn/avatar.png',
        difficulty_preference: 'easy',
        max_prep_time: 20,
        gemini_api_key: null,
        excluded_ingredients: ['maní'],
        available_equipment: ['licuadora'],
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockProfileRow, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getUserProfile(mockUser.id);

      expect(result).toMatchObject({
        username: 'chef',
        dietary_preference: 'vegan',
        allergies_restrictions: 'sin frutos secos',
        excluded_ingredients: ['maní'],
        available_equipment: ['licuadora'],
      });
    });
  });

  describe('updateUserProfile', () => {
    it('throws when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(updateUserProfile('user-1', { username: 'demo' })).rejects.toThrow(
        'Usuario no autenticado'
      );
    });

    it('rejects unsupported dietary preference values', async () => {
      const mockUser = { id: 'user-3', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      await expect(
        updateUserProfile(mockUser.id, { dietary_preference: 'keto' as any })
      ).rejects.toThrow('Preferencia dietética no permitida.');
    });

    it('sanitizes arrays and persists data', async () => {
      const mockUser = { id: 'user-4', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      await expect(
        updateUserProfile(mockUser.id, {
          excluded_ingredients: [' maní ', ''],
          available_equipment: ['horno', ' '],
        })
      ).resolves.toBe(true);

      expect(mockUpdate).toHaveBeenCalledWith({
        excluded_ingredients: ['maní'],
        available_equipment: ['horno'],
      });
    });
  });
});
