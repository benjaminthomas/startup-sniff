'use client'

import { useState, useEffect } from 'react'
import { generateTemplateAction } from '@/modules/ai/actions/generate-template'
import { sendRedditMessageAction, getMessageQuotaAction } from '@/modules/reddit/actions/send-message'
import type { TemplateVariant } from '@/lib/constants/template-variants'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MessageTemplatePreviewProps {
  contactId: string
  contactUsername: string
  onClose: () => void
}

/**
 * Epic 2, Story 2.3, 2.4, 2.5: AI Message Templates + Rate Limiting + Message Sending
 *
 * Component to generate, preview, and send AI-generated message templates
 * - Shows 3 variants: Professional, Casual, and Concise
 * - Displays message quota (5/day rate limiting)
 * - Confirmation modal before sending
 * - Success/error states with quota updates
 *
 * Now uses shadcn Dialog for proper full-screen overlay
 */
export function MessageTemplatePreview({ contactId, contactUsername, onClose }: MessageTemplatePreviewProps) {
  const [open, setOpen] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<TemplateVariant>('professional')
  const [templates, setTemplates] = useState<Record<TemplateVariant, string | null>>({
    professional: null,
    casual: null,
    concise: null,
    value_first: null
  })
  const [loading, setLoading] = useState<Record<TemplateVariant, boolean>>({
    professional: false,
    casual: false,
    concise: false,
    value_first: false
  })
  const [messageIds, setMessageIds] = useState<Record<TemplateVariant, string | null>>({
    professional: null,
    casual: null,
    concise: null,
    value_first: null
  })
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [quota, setQuota] = useState<{ sent: number; remaining: number; limit: number } | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(true)

  // Sync open state with parent onClose
  useEffect(() => {
    if (!open) {
      onClose()
    }
  }, [open, onClose])

  // Fetch quota on mount
  useEffect(() => {
    const fetchQuota = async () => {
      const result = await getMessageQuotaAction()
      if (result.success) {
        setQuota({ sent: result.sent, remaining: result.remaining, limit: result.limit })
      }
      setQuotaLoading(false)
    }
    fetchQuota()
  }, [])

  const handleGenerateTemplate = async (variant: TemplateVariant) => {
    try {
      setLoading(prev => ({ ...prev, [variant]: true }))
      setError(null)

      const result = await generateTemplateAction(contactId, variant)

      if (!result.success || !result.template) {
        setError(result.error || 'Failed to generate template')
        return
      }

      setTemplates(prev => ({ ...prev, [variant]: result.template! }))
      setMessageIds(prev => ({ ...prev, [variant]: result.messageId! }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(prev => ({ ...prev, [variant]: false }))
    }
  }

  const handleGenerateAll = async () => {
    const variants: TemplateVariant[] = ['professional', 'casual', 'concise']
    await Promise.all(variants.map(v => handleGenerateTemplate(v)))
  }

  const handleSendMessage = async () => {
    const messageId = messageIds[selectedVariant]
    if (!messageId) {
      setError('Message not found. Please regenerate the template.')
      return
    }

    setSending(true)
    setError(null)

    try {
      const result = await sendRedditMessageAction(messageId, templates[selectedVariant]!)

      if (!result.success) {
        setError(result.error || 'Failed to send message')
        setSending(false)
        setShowConfirmation(false)
        return
      }

      // Update quota
      if (result.quotaRemaining !== undefined) {
        setQuota(prev => prev ? {
          ...prev,
          sent: prev.sent + 1,
          remaining: result.quotaRemaining!
        } : null)
      }

      setSendSuccess(true)
      setSending(false)
      setShowConfirmation(false)

      // Close modal after 2 seconds
      setTimeout(() => {
        setOpen(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSending(false)
      setShowConfirmation(false)
    }
  }

  const variantInfo: Record<TemplateVariant, { label: string; description: string; icon: string }> = {
    professional: {
      label: 'Professional',
      description: 'Formal, structured, business-focused',
      icon: '👔'
    },
    casual: {
      label: 'Casual',
      description: 'Friendly, conversational, relatable',
      icon: '😊'
    },
    concise: {
      label: 'Concise',
      description: 'Brief, straight to the point',
      icon: '⚡'
    },
    value_first: {
      label: 'Value First',
      description: 'Lead with immediate value',
      icon: '🎁'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0" showCloseButton={false}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold mb-1 text-white">Generate Message Template</DialogTitle>
              <DialogDescription className="text-purple-100">For u/{contactUsername}</DialogDescription>
              {quota && !quotaLoading && (
                <div className="mt-2 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
                  <span className="font-semibold">{quota.remaining}</span>
                  <span className="text-purple-100">messages remaining today</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Success Banner */}
          {sendSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-green-900 font-semibold mb-1">Message sent successfully!</h3>
                <p className="text-sm text-green-700">
                  Your message has been sent to u/{contactUsername} via Reddit DM.
                  {quota && <span className="block mt-1">You have {quota.remaining} messages remaining today.</span>}
                </p>
              </div>
            </div>
          )}

          {/* Quota Warning */}
          {quota && quota.remaining === 0 && !sendSuccess && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-orange-900 font-semibold mb-1">Daily message limit reached</h3>
                <p className="text-sm text-orange-700">
                  You&apos;ve sent {quota.limit} messages today. Your quota will reset in 24 hours.
                </p>
              </div>
            </div>
          )}

          {/* Generate All Button */}
          {!templates.professional && !templates.casual && !templates.concise && (
            <div className="text-center mb-6">
              <Button
                onClick={handleGenerateAll}
                disabled={loading.professional || loading.casual || loading.concise}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700"
              >
                {loading.professional || loading.casual || loading.concise ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Templates...
                  </span>
                ) : (
                  '✨ Generate All Templates'
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                We&apos;ll generate 3 personalized message variants using AI (~3 seconds)
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Variant Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {(['professional', 'casual', 'concise'] as TemplateVariant[]).map(variant => (
              <button
                key={variant}
                onClick={() => setSelectedVariant(variant)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedVariant === variant
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">{variantInfo[variant].icon}</span>
                  <span>{variantInfo[variant].label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Template Display */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 min-h-[300px]">
            {templates[selectedVariant] ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{variantInfo[selectedVariant].label}:</span>{' '}
                    {variantInfo[selectedVariant].description}
                  </div>
                  <button
                    onClick={() => handleGenerateTemplate(selectedVariant)}
                    disabled={loading[selectedVariant]}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    🔄 Regenerate
                  </button>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-300 whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {templates[selectedVariant]}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>✨ AI-generated template • Feel free to edit before sending</span>
                  <span>{templates[selectedVariant]!.length} characters</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {loading[selectedVariant] ? (
                  <>
                    <svg className="w-12 h-12 text-purple-600 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-gray-600 font-medium">Generating {variantInfo[selectedVariant].label} template...</p>
                    <p className="text-sm text-gray-500 mt-2">This usually takes 2-3 seconds</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">{variantInfo[selectedVariant].icon}</div>
                    <p className="text-gray-600 font-medium mb-2">{variantInfo[selectedVariant].label} Template</p>
                    <p className="text-sm text-gray-500 mb-4">{variantInfo[selectedVariant].description}</p>
                    <Button
                      onClick={() => handleGenerateTemplate(selectedVariant)}
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Generate {variantInfo[selectedVariant].label} Template
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t border-gray-200 p-6 bg-gray-50">
          <Button
            onClick={() => setOpen(false)}
            variant="ghost"
            disabled={sending}
          >
            Close
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!templates[selectedVariant] || sending || sendSuccess || (quota?.remaining === 0)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {sendSuccess ? '✓ Sent' : 'Send Message →'}
          </Button>
        </DialogFooter>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-lg font-bold text-gray-900 mb-2">Send message to u/{contactUsername}?</DialogTitle>
                    <DialogDescription className="text-sm text-gray-600 mb-3">
                      This will send the message from your Reddit account. Make sure you&apos;ve reviewed the message before sending.
                    </DialogDescription>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm text-gray-700 max-h-40 overflow-y-auto mb-3">
                      {templates[selectedVariant]}
                    </div>
                    {quota && (
                      <p className="text-xs text-gray-500">
                        After sending, you&apos;ll have {quota.remaining - 1} message{quota.remaining - 1 !== 1 ? 's' : ''} remaining today.
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <DialogFooter>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  variant="ghost"
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
