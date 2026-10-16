import { supabase } from './supabase';

/** True when real Supabase credentials are present (not the build placeholders). */
export function isSupabaseConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://zlyrofuwxdabohjerrqq.supabase.co';
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpseXJvZnV3eGRhYm9oamVycnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzAyODIsImV4cCI6MjEwNzA0NjI4Mn0.eFA74_xEk5qhEnoY1WnxcNGPDHaG20b62LYCRPiRMO0';
  return Boolean(url && key && !url.includes('placeholder') && key !== 'placeholder');
}

/**
 * Optional extra lock: comma-separated admin emails in VITE_ADMIN_EMAILS.
 * The real enforcement is the RLS policy in Supabase (see Admin → Setup tab).
 */
const ALLOWED_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined ?? '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedAdmin(email?: string | null): boolean {
  if (!email) return false;
  if (ALLOWED_ADMIN_EMAILS.length === 0) return true; // allow-list not configured
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
}

export function adminAllowListConfigured(): boolean {
  return ALLOWED_ADMIN_EMAILS.length > 0;
}

export interface AdminSessionInfo {
  email: string | null;
}

export async function getAdminSession(): Promise<AdminSessionInfo | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  const email = data.session?.user?.email ?? null;
  return email ? { email } : null;
}

export function onAdminAuthChange(callback: (session: AdminSessionInfo | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    const email = session?.user?.email ?? null;
    callback(email ? { email } : null);
  });
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured on this deployment.' };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { error: error.message };

  if (!isAllowedAdmin(data.user?.email)) {
    await supabase.auth.signOut();
    return { error: 'That account is not authorised for the admin dashboard.' };
  }
  return { error: null };
}

export async function signOutAdmin(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* already signed out */
  }
}
