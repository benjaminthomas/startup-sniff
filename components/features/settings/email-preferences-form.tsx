'use client'

/**
 * Email Preferences Form Component
 * Epic 2, Story 2.9: Email Notifications and Engagement
 */

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  getEmailPreferencesAction,
  updateEmailPreferencesAction,
  type EmailPreferences,
} from '@/modules/notifications/actions/email-preferences'

export function EmailPreferencesForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<EmailPreferences>({
    marketing: true,
    product_updates: true,
    weekly_summary: true,
    message_confirmations: true,
    onboarding: true,
  })

  // Load initial preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const result = await getEmailPreferencesAction()
        if (result.success && result.preferences) {
          setPreferences(result.preferences)
        }
      } catch (error) {
        console.error('Failed to load email preferences:', error)
        toast({
          title: 'Error',
          description: 'Failed to load email preferences',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [toast])

  const handleToggle = (key: keyof EmailPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateEmailPreferencesAction(preferences)

      if (result.success) {
        toast({
          title: 'Saved',
          description: 'Email preferences updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update preferences',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to save email preferences:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="message-confirmations">Message Confirmations</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you send messages via Reddit
            </p>
          </div>
          <Switch
            id="message-confirmations"
            checked={preferences.message_confirmations}
            onCheckedChange={() => handleToggle('message_confirmations')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weekly-summary">Weekly Summary</Label>
            <p className="text-sm text-muted-foreground">
              Weekly email with your activity and top opportunities
            </p>
          </div>
          <Switch
            id="weekly-summary"
            checked={preferences.weekly_summary}
            onCheckedChange={() => handleToggle('weekly_summary')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="onboarding">Onboarding Emails</Label>
            <p className="text-sm text-muted-foreground">
              Tips and success stories during your first week
            </p>
          </div>
          <Switch
            id="onboarding"
            checked={preferences.onboarding}
            onCheckedChange={() => handleToggle('onboarding')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="product-updates">Product Updates</Label>
            <p className="text-sm text-muted-foreground">
              New features, improvements, and announcements
            </p>
          </div>
          <Switch
            id="product-updates"
            checked={preferences.product_updates}
            onCheckedChange={() => handleToggle('product_updates')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="marketing">Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">
              Tips, case studies, and special offers
            </p>
          </div>
          <Switch
            id="marketing"
            checked={preferences.marketing}
            onCheckedChange={() => handleToggle('marketing')}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
