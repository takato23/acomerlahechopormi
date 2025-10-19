import { createContext, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import type { UserProfile } from '@/features/user/userTypes';
import { getUserProfile } from '@/features/user/userService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();

  const session = useUserStore((state) => state.session);
  const profile = useUserStore((state) => state.profile);
  const setSession = useUserStore((state) => state.setSession);
  const setProfile = useUserStore((state) => state.setProfile);
  const hydrateFromSupabase = useUserStore((state) => state.hydrateFromSupabase);
  const isHydrated = useUserStore((state) => state.hydrated);
  const isHydrating = useUserStore((state) => state.isHydrating);
  const clearStore = useUserStore((state) => state.clear);

  const user = session?.user ?? null;
  const loading = !isHydrated || isHydrating;

  useEffect(() => {
    hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        clearStore();
        return;
      }

      setSession(nextSession ?? null);

      const userId = nextSession?.user?.id;
      if (userId) {
        const latestProfile = await getUserProfile(userId);
        setProfile(latestProfile ?? null);

        if (event === 'SIGNED_IN') {
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/app')) {
            navigate('/app', { replace: true });
          }
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [clearStore, navigate, setProfile, setSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, metadata: Record<string, unknown> = {}) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/reset-password`,
          data: metadata,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    [],
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    clearStore();
  }, [clearStore]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const refreshedProfile = await getUserProfile(user.id);
    setProfile(refreshedProfile ?? null);
  }, [setProfile, user?.id]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      login,
      register,
      sendPasswordReset,
      updatePassword,
      logout,
      refreshProfile,
    }),
    [
      session,
      user,
      profile,
      loading,
      login,
      logout,
      register,
      sendPasswordReset,
      updatePassword,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
