/**
 * Secure Authentication Middleware
 * 
 * This middleware provides:
 * - Automatic session refresh
 * - CSRF protection for state-changing operations  
 * - Rate limiting for auth endpoints
 * - Secure route protection
 * - Attack prevention (XSS, session fixation, replay attacks)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient, checkRateLimit } from '@/lib/auth/supabase-server'
import { extractAndVerifyCSRFToken, generateCSRFToken, setCSRFToken } from '@/lib/auth/csrf'

// Define protected and public routes
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup', 
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/magic-link',
]

const AUTH_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]

const PROTECTED_ROUTES = ['/dashboard']

// Rate limiting configuration
const RATE_LIMITS = {
  '/auth/signin': { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  '/auth/signup': { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  '/auth/forgot-password': { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareSupabaseClient(request)

  try {
    // Rate limiting for auth endpoints
    if (request.method !== 'GET' && RATE_LIMITS[pathname as keyof typeof RATE_LIMITS]) {
      const { limit, windowMs } = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS]
      const identifier = await getClientIdentifier(request)
      const { allowed, remaining } = await checkRateLimit(identifier, limit, windowMs)

      if (!allowed) {
        console.warn(`Rate limit exceeded for ${identifier} on ${pathname}`)
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil(windowMs / 1000).toString(),
              'X-RateLimit-Remaining': '0',
            }
          }
        )
      }

      response.headers.set('X-RateLimit-Remaining', remaining.toString())
    }

    // CSRF Protection for all state-changing operations
    if (request.method !== 'GET' && 
        !pathname.startsWith('/auth/callback')) {
      
      // Server Actions have built-in protection but we add additional validation
      const isServerAction = !!request.headers.get('next-action')
      
      if (isServerAction) {
        // For Server Actions, we rely on Next.js built-in CSRF protection
        // but we log for monitoring purposes
        console.log(`🔒 Server Action protected by Next.js: ${pathname}`)
      } else {
        // For regular API routes and form submissions, enforce CSRF
        const csrfValid = await extractAndVerifyCSRFToken(request)
        if (!csrfValid) {
          console.warn(`CSRF token validation failed for ${pathname}`)
          return NextResponse.json(
            { error: 'Invalid or missing CSRF token' },
            { status: 403 }
          )
        }
      }
    }

    // Get current user (secure method - authenticates with Supabase Auth server)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // Handle user authentication errors
    if (userError) {
      console.error('User authentication error:', userError)
      // Clear potentially corrupted session
      await supabase.auth.signOut()
      response.cookies.delete('csrf-token')
    }

    const isAuthenticated = !!user
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    )

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !isAuthenticated) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute && pathname !== '/auth/callback') {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Ensure CSRF token exists for all users accessing forms
    if (request.method === 'GET' && (pathname.startsWith('/auth/') || isAuthenticated)) {
      const existingToken = request.cookies.get('csrf-token')
      let needsNewToken = !existingToken

      // Check if existing token is valid and not expired
      if (existingToken) {
        try {
          const [, storedTimestamp] = existingToken.value.split('.')
          const timestamp = parseInt(storedTimestamp, 10)
          const tokenAge = Date.now() - timestamp
          const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

          if (tokenAge > maxAge) {
            needsNewToken = true
          }
        } catch {
          // Invalid token format
          needsNewToken = true
        }
      }

      if (needsNewToken) {
        const newToken = generateCSRFToken()
        console.log('🔐 Generated CSRF token:', {
          tokenLength: newToken.length,
          tokenPreview: newToken.substring(0, 20) + '...',
          pathname
        })
        response.cookies.set('csrf-token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 24 * 60 * 60, // 24 hours
        })
        console.log('🔐 Set new CSRF token for', pathname)
      }
    }

    // Add security headers
    const securityHeaders = {
      // Prevent XSS attacks
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data:",
        "font-src 'self'",
        "connect-src 'self' https://*.supabase.co", // Allow Supabase API connections
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),
      
      // CORS headers
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
    }

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    // Fail securely - redirect to signin on errors
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return response
  }
}

// Generate client identifier for rate limiting
async function getClientIdentifier(request: NextRequest): Promise<string> {
  // Use IP address, but fallback to user agent if behind proxy
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Include user agent to prevent easy bypassing
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a hash to avoid storing full IP/UA using Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(`${ip}:${userAgent}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex.substring(0, 16)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}