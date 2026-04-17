/**
 * Supabase Client Configuration
 * 
 * This file provides the browser/client Supabase instance.
 * Service-role clients must live in server-only modules.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client (Browser)
 * Uses SSR helpers for proper cookie-based auth
 * Respects Row Level Security (RLS) policies
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep browser sessions fresh; stale/invalid refresh tokens are cleared in AuthProvider.
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
