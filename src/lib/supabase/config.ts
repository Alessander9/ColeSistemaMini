// Comprobación compartida (navegador, servidor y middleware) de si hay un proyecto Supabase real.
// Con los valores de ejemplo de .env.example la app trabaja solo con datos locales y no hace llamadas de red.

const PLACEHOLDER_MARKERS = ['demo.supabase.co', 'placeholder', 'your-project', 'your_project', 'example', 'xxxx'];
const KEY_PLACEHOLDER_MARKERS = ['placeholder', 'demo-anon-key', 'your-anon-key', 'your_anon_key', 'your-'];

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) return false;

  let host = '';
  try {
    const parsed = new URL(supabaseUrl);
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !isLocal) return false;
    host = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }

  if (PLACEHOLDER_MARKERS.some(m => host.includes(m))) return false;
  const key = supabaseAnonKey.toLowerCase();
  if (KEY_PLACEHOLDER_MARKERS.some(m => key.includes(m))) return false;
  return true;
}

// Tiempo máximo por consulta: si Supabase no responde, la app sigue con los datos locales
export const SUPABASE_REQUEST_TIMEOUT_MS = 8000;
