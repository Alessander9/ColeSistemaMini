import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (
    supabaseUrl.includes('demo.supabase.co') ||
    supabaseUrl.includes('placeholder') ||
    supabaseAnonKey.includes('placeholder') ||
    supabaseAnonKey.includes('demo-anon-key')
  ) {
    return false;
  }
  return true;
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

