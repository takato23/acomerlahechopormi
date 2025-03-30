import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Importar useNavigate
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

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
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // <-- Obtener navigate

  useEffect(() => {
    async function getInitialSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession(); // <-- CORREGIDO para capturar error
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Evitar configurar la suscripción si estamos cargando la sesión inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // No procesar eventos INITIAL_SESSION aquí
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state changed:', event, session)
          setSession(session)
          setUser(session?.user ?? null);
          
          // Solo redirigir a /app si hay un inicio de sesión explícito
          if (event === 'SIGNED_IN' && session) {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/app')) {
              navigate('/app', { replace: true });
            }
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate]) // Añadir navigate como dependencia

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching profile:', error)
          } else {
            setProfile(data as UserProfile)
          }
        })
    } else {
      setProfile(null)
    }
  }, [user])

  // Definir funciones login/logout dentro del provider
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // No es necesario hacer más aquí, onAuthStateChange actualizará el estado
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // No es necesario hacer más aquí, onAuthStateChange actualizará el estado
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