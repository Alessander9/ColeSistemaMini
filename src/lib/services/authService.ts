import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { MOCK_USERS } from '@/lib/mock-data';

// Pide al servidor la cookie de sesión firmada. En modo Supabase el servidor ignora el rol enviado
// y lo lee del perfil del usuario autenticado; en modo demo solo se acepta si el servidor lo permite.
async function requestServerSession(user: UserProfile): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: user.rol, userId: user.id }),
    });
    if (res.ok) return null;
    const body = await res.json().catch(() => null);
    return body?.error || 'No se pudo iniciar la sesión en el servidor.';
  } catch {
    return 'Error de conexión con el servidor de autenticación.';
  }
}

export async function loginWithCredentials(emailOrUsername: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  // 1. Si Supabase no está configurado con credenciales reales, autenticar localmente contra base de datos interna
  if (!isSupabaseConfigured()) {
    const cleanInput = emailOrUsername.trim().toLowerCase();
    const userMap = new Map<string, UserProfile>();
    MOCK_USERS.forEach((u) => userMap.set(u.id, u));

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('colegio_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((u: UserProfile) => {
              if (!u || !u.id) return;
              // Datos guardados antes de que las cuentas demo tuvieran contraseña: conservar la de la semilla
              const seed = userMap.get(u.id);
              userMap.set(u.id, { ...u, password: u.password || seed?.password });
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    const userList = Array.from(userMap.values());

    const matchedUser = userList.find(u =>
      u.email?.toLowerCase() === cleanInput ||
      u.username?.toLowerCase() === cleanInput ||
      u.dni === cleanInput
    );

    // Mismo mensaje para usuario inexistente y contraseña errada: no revela qué cuentas existen
    if (!matchedUser || !matchedUser.password || matchedUser.password !== password) {
      return { user: null, error: 'Usuario o contraseña incorrectos. Verifica tus credenciales.' };
    }

    if (matchedUser.activo === false) {
      return { user: null, error: 'Tu acceso está bloqueado. Comunícate con la dirección del colegio.' };
    }

    if (typeof window !== 'undefined') {
      const sessionError = await requestServerSession(matchedUser);
      if (sessionError) return { user: null, error: sessionError };
    }

    return { user: matchedUser, error: null };
  }

  const supabase = createClient();

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@colegio.edu.pe`,
      password,
    });

    if (authError || !authData.user) {
      return { user: null, error: 'Usuario o contraseña incorrectos. Verifica tus credenciales.' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { user: null, error: 'Perfil de usuario no encontrado en la base de datos.' };
    }

    if (profile.activo === false) {
      await supabase.auth.signOut();
      return { user: null, error: 'Tu acceso está bloqueado. Comunícate con la dirección del colegio.' };
    }

    const sessionError = await requestServerSession(profile as UserProfile);
    if (sessionError) {
      await supabase.auth.signOut();
      return { user: null, error: sessionError };
    }

    return { user: profile as UserProfile, error: null };
  } catch {
    return { user: null, error: 'Error de conexión con el servidor de autenticación.' };
  }
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await createClient().auth.signOut();
    } catch {
      /* ignore */
    }
  }

  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
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
  if (!isSupabaseConfigured()) return null;
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
