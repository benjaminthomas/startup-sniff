/**
 * User Settings Page
 * Story 2.9: Email Notifications and Engagement
 *
 * Allows users to manage email preferences
 */

import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/features/auth/services/jwt'
import { EmailPreferencesForm } from '@/features/settings/components/email-preferences-form'

export const metadata = {
  title: 'Settings | StartupSniff',
  description: 'Manage your account settings and email preferences'
}

export default async function SettingsPage() {
  // Use JWT session instead of Supabase auth
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* Page Header - New Design System Style */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-600">
          Manage your account preferences and email notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-neutral-600">Email:</span>
              <p className="text-neutral-900 mt-1">{session.email}</p>
            </div>
          </div>
        </div>

        {/* Email Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Email Preferences
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Choose which emails you&apos;d like to receive from StartupSniff
            </p>
          </div>

          <EmailPreferencesForm />
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-[#EF4444]/20 p-6">
          <h2 className="text-lg font-semibold text-[#EF4444] mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-neutral-600 mb-4">
            These actions are irreversible. Please be certain.
          </p>
          <button
            className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Delete Account (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
