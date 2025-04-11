import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types/userTypes';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (userId: string): Promise<Profile> => {
    try {
      console.log('[AuthContext] Loading profile for user:', userId);

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single();

      // Si encontramos el perfil, lo retornamos
      if (existingProfile) {
        console.log('[AuthContext] Existing profile found:', existingProfile);
        return existingProfile;
      }

      // Si el error no es de "perfil no encontrado", es un error real
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[AuthContext] Error fetching profile:', fetchError);
        throw fetchError;
      }

      // Si no encontramos el perfil, creamos uno nuevo
      console.log('[AuthContext] No profile found, creating new one...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          avatar_url: null
        }])
        .select()
        .single();

      if (createError) {
        console.error('[AuthContext] Error creating profile:', createError);
        throw createError;
      }

      console.log('[AuthContext] New profile created:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('[AuthContext] Profile error:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id)
          .then(setProfile)
          .catch(error => setError(error.message))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Suscribirse a cambios en auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        loadProfile(session.user.id)
          .then(setProfile)
          .catch(error => setError(error.message));
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setError(null);
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      setError(error instanceof Error ? error.message : 'Error al cerrar sesión');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        error,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
