/**
 * Email Preferences Settings Page
 * Epic 2, Story 2.9: Email Notifications and Engagement
 *
 * Allows users to manage their email notification preferences
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/modules/auth/actions'
import { EmailPreferencesForm } from '@/components/features/settings/email-preferences-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Email Preferences - StartupSniff',
  description: 'Manage your email notification preferences',
}

async function EmailPreferencesContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Email Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Control which emails you receive from StartupSniff
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Choose which email notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailPreferencesForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Email Notifications</CardTitle>
            <CardDescription>Learn about the emails we send</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Message Confirmations</h4>
              <p className="text-muted-foreground">
                Get instant confirmation when you send messages to Reddit users, with tracking links
                to your conversations dashboard.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Weekly Summary</h4>
              <p className="text-muted-foreground">
                A weekly roundup of your activity: messages sent, replies received, and top new
                opportunities matching your interests.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Onboarding Emails</h4>
              <p className="text-muted-foreground">
                Helpful tips and success stories during your first week to help you get the most
                out of StartupSniff.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Product Updates</h4>
              <p className="text-muted-foreground">
                Announcements about new features, improvements, and platform updates.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Marketing Emails</h4>
              <p className="text-muted-foreground">
                Occasional emails about tips, case studies, and special offers.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Unsubscribe from All Emails</CardTitle>
            <CardDescription>
              You&apos;ll only receive critical account security notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Note: You can always re-enable emails by updating your preferences above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function EmailPreferencesPage() {
  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <EmailPreferencesContent />
    </Suspense>
  )
}
