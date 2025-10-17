import { supabase } from '@/lib/supabaseClient';

export interface DashboardLayout {
  id?: string;
  user_id: string;
  layout: DashboardWidgetLayout[];
  created_at?: string;
  updated_at?: string;
}

export interface DashboardWidgetLayout {
  id: string;
  type: 'today-plan' | 'shopping-list' | 'favorites' | 'low-stock' | 'weekly-progress' | 'recommendations';
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVisible: boolean;
  order: number;
}

// LocalStorage keys
const getLayoutKey = (userId: string) => `dashboard-layout-${userId}`;

// Supabase operations
export const saveDashboardLayoutToSupabase = async (
  userId: string,
  layout: DashboardWidgetLayout[]
): Promise<DashboardLayout | null> => {
  try {
    const layoutData: Omit<DashboardLayout, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      layout,
    };

    const { data, error } = await supabase
      .from('dashboard_layouts')
      .upsert(layoutData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving dashboard layout to Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error saving dashboard layout to Supabase:', error);
    return null;
  }
};

export const getDashboardLayoutFromSupabase = async (
  userId: string
): Promise<DashboardLayout | null> => {
  try {
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No layout found, return null
        return null;
      }
      console.error('Error fetching dashboard layout from Supabase:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching dashboard layout from Supabase:', error);
    return null;
  }
};

// LocalStorage operations
export const saveDashboardLayoutToLocalStorage = (
  userId: string,
  layout: DashboardWidgetLayout[]
): void => {
  try {
    const layoutData: DashboardLayout = {
      user_id: userId,
      layout,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(getLayoutKey(userId), JSON.stringify(layoutData));
  } catch (error) {
    console.error('Error saving dashboard layout to localStorage:', error);
  }
};

export const getDashboardLayoutFromLocalStorage = (
  userId: string
): DashboardLayout | null => {
  try {
    const stored = localStorage.getItem(getLayoutKey(userId));
    if (!stored) return null;

    return JSON.parse(stored);
  } catch (error) {
    console.error('Error fetching dashboard layout from localStorage:', error);
    return null;
  }
};

// Hybrid approach: Try Supabase first, fallback to localStorage, then save to both
export const getDashboardLayout = async (userId: string): Promise<DashboardLayout | null> => {
  // Try Supabase first
  let layout = await getDashboardLayoutFromSupabase(userId);

  if (!layout) {
    // Fallback to localStorage
    layout = getDashboardLayoutFromLocalStorage(userId);
  }

  return layout;
};

export const saveDashboardLayout = async (
  userId: string,
  layout: DashboardWidgetLayout[]
): Promise<void> => {
  // Save to Supabase (async)
  await saveDashboardLayoutToSupabase(userId, layout);

  // Save to localStorage (sync) for immediate availability
  saveDashboardLayoutToLocalStorage(userId, layout);
};

// Default layout configuration
export const getDefaultDashboardLayout = (): DashboardWidgetLayout[] => [
  {
    id: 'today-plan',
    type: 'today-plan',
    position: { x: 0, y: 0 },
    size: { width: 2, height: 2 },
    isVisible: true,
    order: 0,
  },
  {
    id: 'shopping-list',
    type: 'shopping-list',
    position: { x: 2, y: 0 },
    size: { width: 1, height: 2 },
    isVisible: true,
    order: 1,
  },
  {
    id: 'favorites',
    type: 'favorites',
    position: { x: 0, y: 2 },
    size: { width: 2, height: 1 },
    isVisible: true,
    order: 2,
  },
  {
    id: 'low-stock',
    type: 'low-stock',
    position: { x: 2, y: 2 },
    size: { width: 1, height: 1 },
    isVisible: true,
    order: 3,
  },
  {
    id: 'weekly-progress',
    type: 'weekly-progress',
    position: { x: 0, y: 3 },
    size: { width: 3, height: 1 },
    isVisible: true,
    order: 4,
  },
  {
    id: 'recommendations',
    type: 'recommendations',
    position: { x: 0, y: 4 },
    size: { width: 3, height: 1 },
    isVisible: true,
    order: 5,
  },
];
