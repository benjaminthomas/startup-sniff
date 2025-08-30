/**
 * Secure Forgot Password Page
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/actions'
import { getOrGenerateCSRFToken } from '@/lib/auth/csrf'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Password | StartupSniff',
  description: 'Reset your StartupSniff account password securely',
}

export default async function ForgotPasswordPage() {
  // Check if user is already authenticated
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

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
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <ForgotPasswordForm csrfToken={csrfToken} />

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