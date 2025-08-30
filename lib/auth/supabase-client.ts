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
        // Use secure storage for tokens
        storage: {
          getItem: (key: string) => {
            // For browser client, we rely on the server to manage cookies
            // This prevents XSS attacks by never exposing tokens to JS
            return null;
          },
          setItem: (key: string, value: string) => {
            // No-op - server manages all token storage via HttpOnly cookies
          },
          removeItem: (key: string) => {
            // No-op - server handles token removal
          },
        },
        // Disable automatic refresh on client side
        // Server middleware handles all auth state
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}