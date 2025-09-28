/**
 * Secure Sign Up Page
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { getCurrentUser } from '@/lib/auth/actions'
import { getOrGenerateCSRFToken } from '@/lib/auth/csrf'
import { SignUpForm } from '@/components/auth/signup-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Sign Up | StartupSniff',
  description: 'Create your secure StartupSniff account',
}

// Force dynamic rendering since this page uses cookies/auth
export const dynamic = 'force-dynamic'

interface SignUpPageProps {
  searchParams: Promise<{
    message?: string
    error?: string
  }>
}

async function SignUpPageContent({ searchParams }: SignUpPageProps) {
  // Check if user is already authenticated
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  // Get CSRF token for the form (safe for Server Components)
  const csrfToken = await getOrGenerateCSRFToken()
  
  // Await searchParams
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Start discovering trending startup opportunities with AI-powered insights
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

          <SignUpForm csrfToken={csrfToken} />

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href={"/terms" as Route} className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href={"/privacy" as Route} className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage(props: SignUpPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SignUpPageContent {...props} />
    </Suspense>
  )
}