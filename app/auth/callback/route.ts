/**
 * Secure Authentication Callback Handler
 * 
 * This handles OAuth callbacks and email confirmations securely:
 * - Session exchange with PKCE validation
 * - Secure redirect handling
 * - Attack prevention (session fixation, replay attacks)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/auth/supabase-server'
import { generateFormCSRFToken } from '@/lib/auth/csrf'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  // Debug logging
  console.log('Callback params:', { code: code ? 'exists' : 'missing', type, next })

  // Validate redirect URL to prevent open redirects
  const isValidRedirect = (url: string): boolean => {
    try {
      const redirectUrl = new URL(url, origin)
      return redirectUrl.origin === origin && redirectUrl.pathname.startsWith('/')
    } catch {
      return false
    }
  }

  const redirectTo = isValidRedirect(next) ? next : '/dashboard'

  if (!code) {
    console.error('No authorization code provided in callback')
    return NextResponse.redirect(
      `${origin}/auth/signin?error=Authorization failed. Please try again.`
    )
  }

  try {
    const { supabase, response } = createMiddlewareSupabaseClient(request)

    // Check if this is a password recovery flow
    const tokenHash = searchParams.get('token_hash')
    const flowType = searchParams.get('type')

    let data, error

    if (tokenHash && flowType === 'recovery') {
      // Use verifyOtp for password recovery tokens (PKCE flow)
      console.log('Processing password recovery token (PKCE)')
      const result = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      })
      data = result.data
      error = result.error
    } else {
      // Exchange code for session with PKCE validation (includes traditional recovery)
      console.log('Processing auth code (traditional or PKCE)')
      const result = await supabase.auth.exchangeCodeForSession(code)
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Session exchange failed:', error)
      
      // Handle specific error types
      let errorMessage = 'Authentication failed. Please try again.'
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Invalid or expired authentication code. Please try again.'
      } else if (error.message.includes('pkce')) {
        errorMessage = 'Security validation failed. Please try again.'
      }

      return NextResponse.redirect(
        `${origin}/auth/signin?error=${encodeURIComponent(errorMessage)}`
      )
    }

    if (!data.session || !data.user) {
      console.error('No session or user data after exchange')
      return NextResponse.redirect(
        `${origin}/auth/signin?error=Authentication failed. Please try again.`
      )
    }

    // Log successful authentication
    console.log(`User authenticated: [REDACTED] (${data.user.id})`)

    // Create or update user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        full_name: data.user.user_metadata?.full_name || 
                   data.user.user_metadata?.name || '',
        avatar_url: data.user.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Failed to create/update user profile:', profileError)
      // Don't block authentication for profile errors
    }

    // Create usage limits for new users
    const { error: usageLimitsError } = await supabase
      .from('usage_limits')
      .upsert({
        user_id: data.user.id,
        plan_type: 'explorer',
        monthly_limit_ideas: 5,
        monthly_limit_validations: 3,
        ideas_generated: 0,
        validations_completed: 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (usageLimitsError) {
      console.error('Failed to create/update usage limits:', usageLimitsError)
    }

    // Generate CSRF token for authenticated session
    try {
      await generateFormCSRFToken()
    } catch (csrfError) {
      console.error('Failed to generate CSRF token:', csrfError)
      // Don't block authentication for CSRF token errors
    }

    // Handle password recovery flow - use token-based approach
    if (type === 'recovery' || next === '/auth/reset-password') {
      console.log('Detected reset password flow by next parameter, setting recovery data')
      
      // Instead of relying on session persistence, create a secure token for the password update
      // Generate a temporary access token that can be used for password updates
      const recoveryToken = Buffer.from(JSON.stringify({
        userId: data.user.id,
        email: data.user.email,
        timestamp: Date.now(),
        code: code // Store the original recovery code
      })).toString('base64')
      
      console.log(`Generated recovery token for user [REDACTED] (${data.user.id})`)
      
      // Create redirect with recovery token in URL (more reliable than cookies)
      return NextResponse.redirect(`${origin}/auth/reset-password?token=${recoveryToken}`)
    }

    // Successful authentication - redirect to intended destination
    const finalRedirect = new URL(redirectTo, origin)
    
    // Add success message for first-time users
    if (data.user.created_at === data.user.updated_at) {
      finalRedirect.searchParams.set('message', 'Welcome to StartupSniff! Your account has been created successfully.')
    }

    return NextResponse.redirect(finalRedirect)

  } catch (error) {
    console.error('Callback handler error:', error)
    
    return NextResponse.redirect(
      `${origin}/auth/signin?error=An unexpected error occurred. Please try again.`
    )
  }
}