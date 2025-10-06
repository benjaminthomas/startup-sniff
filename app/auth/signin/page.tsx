/**
 * Secure Sign In Page
 * 
 * Security features:
 * - CSRF protection via hidden form token
 * - Input validation and sanitization
 * - Rate limiting handled by middleware
 * - XSS prevention through proper escaping
 * - Secure error handling without user enumeration
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getCurrentUser } from '@/lib/auth/actions'
import { getOrGenerateCSRFToken } from '@/lib/auth/csrf'
import { SignInForm } from '@/components/auth/signin-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Sign In | StartupSniff',
  description: 'Sign in to your StartupSniff account securely',
}

// Force dynamic rendering since this page uses cookies/auth
export const dynamic = 'force-dynamic'

interface SignInPageProps {
  searchParams: Promise<{
    message?: string
    error?: string
    redirectTo?: string
  }>
}

async function SignInPageContent({ searchParams }: SignInPageProps) {
  // Check if user is already authenticated
  const user = await getCurrentUser()
  
  // Await searchParams
  const params = await searchParams
  
  if (user) {
    const redirectTo = params.redirectTo || '/dashboard'
    redirect(redirectTo as Route)
  }

  // Generate CSRF token for the form
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
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your StartupSniff account securely
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {params.message && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                {params.message}
              </p>
            </div>
          )}

          {params.error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                {params.error}
              </p>
            </div>
          )}

          <SignInForm 
            csrfToken={csrfToken}
            redirectTo={params.redirectTo}
          />


          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Sign up
            </Link>
          </div>

          <div className="text-center text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage(props: SignInPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SignInPageContent {...props} />
    </Suspense>
  )
}