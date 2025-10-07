/**
 * Secure Password Reset Page
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getOrGenerateCSRFToken } from '@/lib/auth/csrf'
import { createServerAdminClient } from '@/lib/auth/supabase-server'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Password | StartupSniff',
  description: 'Set your new StartupSniff account password',
}

// Force dynamic rendering since this page uses cookies/auth
export const dynamic = 'force-dynamic'

interface ResetPasswordPageProps {
  searchParams: Promise<{
    code?: string
    error?: string
    recovery?: string
    token?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams
  const code = params.code
  const error = params.error
  const recoveryParam = params.recovery === 'true'
  const recoveryToken = params.token
  
  // If there's an error from the callback, show it
  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(error)}`)
  }
  
  // Check if this is a valid password recovery session
  const cookieStore = await cookies()
  const recoverySession = cookieStore.get('auth-recovery')
  
  // Get user session directly from Supabase client
  const supabase = createServerAdminClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Debug logging
  console.log('Reset password page - Recovery session:', recoverySession ? 'exists' : 'missing')
  console.log('Reset password page - Code param:', code ? 'exists' : 'missing')
  console.log('Reset password page - Recovery param:', recoveryParam ? 'true' : 'false')
  console.log('Reset password page - Direct user check:', user ? 'authenticated' : 'not authenticated')
  console.log('Reset password page - User error:', userError ? userError.message : 'none')
  
  // Handle password reset code if present
  if (code) {
    try {
      const supabase = createServerAdminClient()
      
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Password reset code exchange failed:', exchangeError)
        redirect('/auth/forgot-password?error=Invalid or expired reset link. Please request a new one.')
      }
      
      if (!data.session || !data.user) {
        console.error('No session data after password reset code exchange')
        redirect('/auth/forgot-password?error=Invalid or expired reset link. Please request a new one.')
      }
      
      // Set recovery cookie for this session
      const cookieStore = await cookies()
      cookieStore.set('auth-recovery', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      })
      
      // Redirect to the same page without the code parameter to clean the URL
      redirect('/auth/reset-password')
    } catch (error) {
      console.error('Password reset code handling error:', error)
      redirect('/auth/forgot-password?error=An error occurred processing your reset link. Please request a new one.')
    }
  }
  
  // Allow access if any of:
  // 1. Recovery session cookie exists (traditional flow)
  // 2. User is authenticated (came from password reset callback)
  // 3. Recovery URL parameter is present (callback flow)
  // 4. Recovery token is present (new token-based flow)
  const hasAccess = recoverySession || user || recoveryParam || recoveryToken
  
  if (!hasAccess) {
    console.log('Access denied - Recovery cookie:', recoverySession ? 'exists' : 'missing', 'User:', user ? 'authenticated' : 'not authenticated', 'Recovery param:', recoveryParam)
    redirect('/auth/forgot-password?error=Invalid or expired reset link. Please request a new one.')
  }

  console.log('Reset password access granted - Recovery cookie:', recoverySession ? 'exists' : 'missing', 'User:', user ? 'authenticated' : 'not authenticated', 'Recovery param:', recoveryParam)

  // Get CSRF token for the form
  const csrfToken = await getOrGenerateCSRFToken()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <CardDescription>
            Choose a strong password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {recoverySession && (
            <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This link will expire in 10 minutes for security.
              </p>
            </div>
          )}

          <ResetPasswordForm csrfToken={csrfToken} recoveryToken={recoveryToken} />

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}