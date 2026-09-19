import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';
import { MOCK_USERS } from '@/lib/mock-data';

export async function loginWithCredentials(emailOrUsername: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  // 1. Si Supabase no está configurado con credenciales reales, autenticar localmente contra base de datos interna
  if (!isSupabaseConfigured()) {
    const cleanInput = emailOrUsername.trim().toLowerCase();
    let userList: UserProfile[] = MOCK_USERS;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('colegio_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            userList = parsed;
          }
        }
      } catch {
        /* ignore */
      }
    }

    const matchedUser = userList.find(u => 
      u.email?.toLowerCase() === cleanInput || 
      u.dni === cleanInput
    );

    if (matchedUser) {
      if (typeof document !== 'undefined') {
        document.cookie = `cole_user_role=${matchedUser.rol}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `cole_access_token=jwt-local-active; path=/; max-age=604800; SameSite=Lax`;
      }
      return { user: matchedUser, error: null };
    }

    return { user: null, error: 'Usuario no encontrado. Verifica tu correo o DNI.' };
  }

  const supabase = createClient();

  try {
    // 1. Intentar inicio de sesión mediante Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@colegio.edu.pe`,
      password,
    });

    if (authError || !authData.user) {
      // Fallback a consulta directa de perfil si está configurado en base de datos
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${emailOrUsername},dni.eq.${emailOrUsername}`)
        .eq('activo', true)
        .single();

      if (profileError || !profile) {
        return { user: null, error: 'Credenciales inválidas o usuario inactivo.' };
      }

      // Guardar cookie de rol para middleware
      if (typeof document !== 'undefined') {
        document.cookie = `cole_user_role=${profile.rol}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `cole_access_token=jwt-supabase-session; path=/; max-age=604800; SameSite=Lax`;
      }

      return { user: profile as UserProfile, error: null };
    }

    // 2. Obtener datos del perfil extendido
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return { user: null, error: 'Perfil de usuario no encontrado en la base de datos.' };
    }

    // Establecer cookie para control en middleware
    if (typeof document !== 'undefined') {
      document.cookie = `cole_user_role=${profile.rol}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `cole_access_token=jwt-supabase-session; path=/; max-age=604800; SameSite=Lax`;
    }

    return { user: profile as UserProfile, error: null };
  } catch {
    return { user: null, error: 'Error de conexión con el servidor de autenticación.' };
  }
}

export async function logoutUser(): Promise<void> {
  const supabase = createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }

  if (typeof document !== 'undefined') {
    const cookiesToClear = [
      'cole_user_role',
      'cole_access_token',
      'cole_session_token',
      'sb-access-token',
      'sb-refresh-token',
    ];
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('colegio_current_user');
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile as UserProfile;
  } catch {
    return null;
  }
}
