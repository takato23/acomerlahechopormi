import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { identifyPosthogUser, resetPosthog } from '@/lib/posthogClient';
import { setUser as setErrorTrackingUser } from '@/lib/errorTracking';

// Mock user data
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'usuario@demo.com',
  user_metadata: {
    username: 'Usuario Demo'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  role: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
} as User;

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER
};

interface UserProfile {
  id: string
  username?: string
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  // Cambiamos signIn/signOut por login/logout definidos en el provider
  login: (email: string, password: string) => Promise<void>;
  signUp: typeof supabase.auth.signUp; // Mantenemos signUp por ahora
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider Component
interface AuthProviderProps {
  children: ReactNode
  useMockData?: boolean
}

export default function AuthProvider({ children, useMockData = true }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(useMockData ? MOCK_SESSION : null);
  const [user, setUser] = useState<User | null>(useMockData ? MOCK_USER : null);
  const [profile, setProfile] = useState<UserProfile | null>(
    useMockData ? {
      id: MOCK_USER.id,
      username: MOCK_USER.user_metadata?.username || 'Usuario Demo'
    } : null
  );
  const [loading, setLoading] = useState(!useMockData); // Solo loading=true si no usamos mock
  const navigate = useNavigate(); // <-- Obtener navigate

  useEffect(() => {
    async function getInitialSession() {
      try {
        if (useMockData) {
          // Usar datos mock
          console.log('Using mock authentication data');
          setSession(MOCK_SESSION);
          setUser(MOCK_USER);
          setProfile({
            id: MOCK_USER.id,
            username: MOCK_USER.user_metadata?.username || 'Usuario Demo'
          });
          console.log('Mock user set:', MOCK_USER);
          setLoading(false);
          console.log('Loading set to false');
        } else {
          // Usar Supabase real
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting initial session:', error);
          }
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // En caso de error, usar datos mock como fallback
        if (useMockData) {
          setSession(MOCK_SESSION);
          setUser(MOCK_USER);
          setProfile({
            id: MOCK_USER.id,
            username: MOCK_USER.user_metadata?.username || 'Usuario Demo'
          });
        }
        setLoading(false);
      }
    }

    getInitialSession();

    // Solo configurar suscripción de Supabase si no estamos usando mock data
    let subscription: any = null;
    if (!useMockData) {
      const supabaseSubscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event !== 'INITIAL_SESSION') {
            console.log('Auth state changed:', event, session);
            setSession(session);
            setUser(session?.user ?? null);

            if (event === 'SIGNED_IN' && session) {
              const currentPath = window.location.pathname;
              if (!currentPath.startsWith('/app')) {
                navigate('/app', { replace: true });
              }
            }
          }
        }
      );
      subscription = supabaseSubscription.data.subscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate, useMockData]);

  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!user || useMockData) {
        if (user && useMockData) {
          // Ya se configuró el perfil mock en getInitialSession
          setProfile({
            id: user.id,
            username: user.user_metadata?.username || 'Usuario Demo'
          });
        } else {
          setProfile(null);
        }
        return;
      }

      try {
        // Intentar obtener el perfil existente
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Perfil no existe, intentar crearlo
            console.log('Profile not found, creating new profile...');
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario'
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              console.log('Profile created successfully:', newProfile);
              setProfile(newProfile as UserProfile);
            }
          } else {
            console.error('Error fetching profile:', error);
          }
        } else {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error('Unexpected error in profile management:', error);
      }
    };

    fetchOrCreateProfile();
  }, [user, useMockData]);

  useEffect(() => {
    if (useMockData) return;
    if (user) {
      const metadata = (user.app_metadata ?? {}) as { plan?: string };
      identifyPosthogUser(user.id, {
        email: user.email ?? undefined,
        plan: metadata.plan,
      });
    } else {
      resetPosthog();
    }
  }, [user, useMockData]);

  useEffect(() => {
    if (user) {
      setErrorTrackingUser({
        id: user.id,
        email: user.email ?? undefined,
        username: user.user_metadata?.username ?? undefined,
      });
    } else {
      setErrorTrackingUser(null);
    }
  }, [user]);

  // Definir funciones login/logout dentro del provider
  const login = async (email: string, password: string) => {
    if (useMockData) {
      // Simular login exitoso con datos mock
      console.log('Mock login successful');
      setSession(MOCK_SESSION);
      setUser(MOCK_USER);
      setProfile({
        id: MOCK_USER.id,
        username: MOCK_USER.user_metadata?.username || 'Usuario Demo'
      });
      navigate('/app', { replace: true });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    if (useMockData) {
      // Simular logout
      console.log('Mock logout');
      setSession(null);
      setUser(null);
      setProfile(null);
      navigate('/', { replace: true });
      resetPosthog();
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    resetPosthog();
  };

  const value = {
    session,
    user,
    profile,
    loading,
    login, // Pasar la nueva función login
    signUp: supabase.auth.signUp,
    logout, // Pasar la nueva función logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
