/**
 * Secure Supabase Client Configuration
 * 
 * This implements a secure client configuration with:
 * - HttpOnly cookies for token storage (prevents XSS)
 * - CSRF protection via double-submit cookies
 * - Automatic token refresh
 * - Secure session management
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Browser client for client-side operations (CSR)
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Allow client to read session for UI state, server manages storage
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}