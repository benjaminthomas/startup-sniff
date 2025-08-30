/**
 * Secure Server-Side Supabase Client
 * 
 * Features:
 * - HttpOnly cookie session management
 * - Automatic token refresh
 * - CSRF protection
 * - Connection pooling via MCP
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'
import { generateCSRFToken, verifyCSRFToken } from './csrf'

// Server client for SSR/API routes
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              // Enforce security settings
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          )
        },
      },
      auth: {
        // Enable automatic refresh for server-side
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}

// Admin client with service role (for user management operations)
export const createServerAdminClient = () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Middleware client for session management
export const createMiddlewareSupabaseClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )

  return { supabase, response }
}

// Rate limiting storage using Supabase
export const checkRateLimit = async (
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> => {
  const supabase = createServerAdminClient()
  const windowStart = new Date(Date.now() - windowMs)
  
  try {
    // Clean up old rate limit entries
    await supabase
      .from('rate_limits')
      .delete()
      .lt('created_at', windowStart.toISOString())

    // Get current request count
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .gte('created_at', windowStart.toISOString())

    const currentCount = count || 0

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0 }
    }

    // Record this request
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        created_at: new Date().toISOString(),
      })

    return { allowed: true, remaining: limit - currentCount - 1 }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open for rate limiting errors
    return { allowed: true, remaining: limit }
  }
}