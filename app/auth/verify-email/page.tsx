/**
 * Email Verification Page
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { verifyEmailAction } from '@/modules/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Verify Email | StartupSniff',
  description: 'Verify your email address to activate your StartupSniff account',
}

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
            <CardDescription>
              The verification link is invalid or missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Please check your email for the correct verification link, or request a new one.
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Suspense fallback={<VerificationLoading />}>
        <VerificationContent token={token} />
      </Suspense>
    </div>
  )
}

function VerificationLoading() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
        <CardDescription>
          Please wait while we verify your email address...
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

async function VerificationContent({ token }: { token: string }) {
  const result = await verifyEmailAction(token)

  if (result.success) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Email Verified!
          </CardTitle>
          <CardDescription>
            {result.message || 'Your email has been successfully verified.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 Welcome to StartupSniff! Your account is now active and you can start discovering amazing startup ideas.
            </p>
          </div>
          <Link href="/auth/signin">
            <Button className="w-full" size="lg">
              Sign In to Your Account
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-destructive rounded-xl flex items-center justify-center">
            <XCircle className="h-6 w-6 text-destructive-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
        <CardDescription>
          {result.error || 'Unable to verify your email address.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            The verification link may have expired or already been used. Please try signing up again or contact support if you continue to have issues.
          </p>
        </div>
        <div className="space-y-2">
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full">
              Sign Up Again
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="ghost" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
