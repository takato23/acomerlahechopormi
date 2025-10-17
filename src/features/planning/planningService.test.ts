import {
  deletePlannedMeal,
  deletePlannedMealsInRange,
  getPlannedMeals,
  upsertPlannedMeal,
} from './planningService';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient');

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('planningService', () => {
  describe('getPlannedMeals', () => {
    it('returns meals in range', async () => {
      const select = jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            order: jest.fn(() => ({
              order: jest.fn(() => ({ data: [{ id: 'meal' }], error: null })),
            })),
          })),
        })),
      }));

      mockFrom.mockImplementationOnce(() => ({ select }));

      const result = await getPlannedMeals('2025-01-01', '2025-01-07');
      expect(result).toEqual([{ id: 'meal' }]);
      expect(select).toHaveBeenCalled();
    });
  });

  describe('upsertPlannedMeal', () => {
    const user = { id: 'user-1' };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user }, error: null });
    });

    it('inserts when no existingMealId provided', async () => {
      const insert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: { id: 'new' }, error: null })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ insert }));

      const meal = await upsertPlannedMeal({ plan_date: '2025-01-01', meal_type: 'lunch' } as any);
      expect(meal).toEqual({ id: 'new' });
      expect(insert).toHaveBeenCalled();
    });

    it('updates when existingMealId provided', async () => {
      const update = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => ({ data: { id: 'updated' }, error: null })),
            })),
          })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ update }));

      const meal = await upsertPlannedMeal(
        { plan_date: '2025-01-01', meal_type: 'dinner' } as any,
        'meal-1',
      );
      expect(meal).toEqual({ id: 'updated' });
    });
  });

  describe('deletePlannedMeal', () => {
    it('removes entry by id', async () => {
      const del = jest.fn(() => ({
        eq: jest.fn(() => ({ error: null })),
      }));
      mockFrom.mockImplementationOnce(() => ({ delete: del }));

      await expect(deletePlannedMeal('meal-1')).resolves.toBe(true);
    });
  });

  describe('deletePlannedMealsInRange', () => {
    it('deletes entries between dates', async () => {
      const del = jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({ error: null })),
        })),
      }));
      mockFrom.mockImplementationOnce(() => ({ delete: del }));

      await expect(deletePlannedMealsInRange('2025-01-01', '2025-01-07')).resolves.toBeUndefined();
    });
  });
});
