/**
 * User Settings Page
 * Story 2.9: Email Notifications and Engagement
 *
 * Allows users to manage email preferences
 */

import { createServerSupabaseClient } from '@/modules/supabase/server'
import { redirect } from 'next/navigation'
import { EmailPreferencesForm } from '@/components/features/settings/email-preferences-form'

export const metadata = {
  title: 'Settings | StartupSniff',
  description: 'Manage your account settings and email preferences'
}

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account preferences and email notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {user.user_metadata?.name && (
              <div>
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <p className="text-gray-900">{user.user_metadata.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Preferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Email Preferences
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose which emails you&apos;d like to receive from StartupSniff
            </p>
          </div>

          <EmailPreferencesForm />
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These actions are irreversible. Please be certain.
          </p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            disabled
          >
            Delete Account (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
