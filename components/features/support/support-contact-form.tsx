'use client'

/**
 * Support Contact Form
 * Epic 1, Story 1.11: Error Handling and Monitoring
 *
 * Provides a contact form accessible from error states
 */

import React, { useState } from 'react'
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SupportContactFormProps {
  /**
   * Pre-fill error details
   */
  errorContext?: {
    errorMessage?: string
    errorStack?: string
    userAgent?: string
    url?: string
  }

  /**
   * Custom trigger button
   */
  trigger?: React.ReactNode

  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: () => void
}

export function SupportContactForm({
  errorContext,
  trigger,
  onSuccess,
}: SupportContactFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    subject: errorContext?.errorMessage
      ? `Error Report: ${errorContext.errorMessage.slice(0, 50)}...`
      : '',
    message: errorContext
      ? generateErrorReport(errorContext)
      : '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Implement actual support ticket submission
      // For now, we'll just log it and send to Sentry
      console.log('Support form submitted:', formData)

      // Send to Sentry as feedback
      if (typeof window !== 'undefined') {
        try {
          const Sentry = await import('@sentry/nextjs')
          Sentry.captureMessage('Support form submitted', {
            level: 'info',
            contexts: {
              support: {
                subject: formData.subject,
                message: formData.message,
                email: formData.email,
              },
              error: errorContext,
            },
          })
        } catch (e) {
          console.error('Failed to send to Sentry:', e)
        }
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsSuccess(true)
      onSuccess?.()

      // Reset form after 3 seconds
      setTimeout(() => {
        setOpen(false)
        setIsSuccess(false)
        setFormData({ subject: '', message: '', email: '' })
      }, 3000)
    } catch (error) {
      console.error('Failed to submit support form:', error)
      // TODO: Show error message
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Support
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Having trouble? Send us a message and we&apos;ll get back to you as
            soon as possible.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Message Sent!</h3>
            <p className="text-sm text-muted-foreground">
              We&apos;ve received your message and will get back to you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Describe the issue you're experiencing..."
                value={formData.message}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {errorContext &&
                  'Error details have been pre-filled. Feel free to add more context.'}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Generates a detailed error report from error context
 */
function generateErrorReport(errorContext: {
  errorMessage?: string
  errorStack?: string
  userAgent?: string
  url?: string
}): string {
  const sections = []

  if (errorContext.errorMessage) {
    sections.push(`Error: ${errorContext.errorMessage}`)
  }

  sections.push('\n--- Technical Details ---')

  if (errorContext.url) {
    sections.push(`Page URL: ${errorContext.url}`)
  }

  if (errorContext.userAgent) {
    sections.push(`User Agent: ${errorContext.userAgent}`)
  }

  sections.push(`Timestamp: ${new Date().toISOString()}`)

  if (errorContext.errorStack) {
    sections.push('\n--- Stack Trace ---')
    sections.push(errorContext.errorStack)
  }

  sections.push('\n--- Your Message ---')
  sections.push('Please describe what you were doing when this error occurred:\n')

  return sections.join('\n')
}

/**
 * Quick support link component
 * Use this for inline "Contact Support" links
 */
export function SupportLink({
  errorContext,
  children,
}: {
  errorContext?: SupportContactFormProps['errorContext']
  children?: React.ReactNode
}) {
  return (
    <SupportContactForm
      errorContext={errorContext}
      trigger={
        <button className="text-sm text-primary underline-offset-4 hover:underline">
          {children || 'Contact Support'}
        </button>
      }
    />
  )
}
