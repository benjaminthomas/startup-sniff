/**
 * Message Card Component
 *
 * Individual message card with outcome logging UI
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateMessageOutcomeAction } from '@/modules/conversations/actions/update-message-outcome'

type OutcomeType = 'replied' | 'call_scheduled' | 'customer_acquired' | 'dead_end' | null

interface Message {
  id: string
  reddit_username: string
  message_text: string
  template_variant: string
  send_status: string
  sent_at: string | null
  outcome: string | null
  replied_at: string | null
  created_at: string | null
  contact: {
    reddit_username: string
    post_excerpt: string | null
    karma: number
    engagement_score: number
  }
  pain_point: {
    reddit_id: string
    title: string
    subreddit: string
  }
}

interface MessageCardProps {
  message: Message
}

export function MessageCard({ message }: MessageCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [localOutcome, setLocalOutcome] = useState(message.outcome)

  const handleOutcomeUpdate = async (newOutcome: OutcomeType) => {
    setIsUpdating(true)
    try {
      const result = await updateMessageOutcomeAction(message.id, newOutcome)
      if (result.success) {
        setLocalOutcome(newOutcome)
        // Celebratory animation for positive outcomes
        if (['replied', 'call_scheduled', 'customer_acquired'].includes(newOutcome || '')) {
          // Trigger confetti or celebration animation here
          console.log('🎉 Celebration for outcome:', newOutcome)
        }
      } else {
        alert(result.error || 'Failed to update outcome')
      }
    } catch (error) {
      console.error('Error updating outcome:', error)
      alert('Failed to update outcome')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = () => {
    switch (message.send_status) {
      case 'sent':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Sent</span>
      case 'draft':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">Draft</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Pending</span>
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Failed</span>
      default:
        return null
    }
  }

  const getOutcomeBadge = () => {
    const outcome = localOutcome || message.outcome
    switch (outcome) {
      case 'replied':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">💬 Replied</span>
      case 'call_scheduled':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">📞 Call Scheduled</span>
      case 'customer_acquired':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">🎉 Customer!</span>
      case 'dead_end':
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">Dead End</span>
      default:
        if (message.send_status === 'sent') {
          return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">⏳ Awaiting Response</span>
        }
        return null
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not sent'
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      {/* Header: Contact & Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`https://reddit.com/user/${message.contact.reddit_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 hover:text-blue-600"
            >
              u/{message.contact.reddit_username}
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{message.contact.karma} karma</span>
          </div>
          <Link
            href={`/dashboard/opportunities/${message.pain_point.reddit_id}`}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Re: {message.pain_point.title}
          </Link>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
              r/{message.pain_point.subreddit}
            </span>
            <span>•</span>
            <span>{formatDate(message.sent_at)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}
          {getOutcomeBadge()}
        </div>
      </div>

      {/* Post Excerpt */}
      {message.contact.post_excerpt && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 border border-gray-200">
          <p className="italic line-clamp-2">&quot;{message.contact.post_excerpt}&quot;</p>
        </div>
      )}

      {/* Message Preview */}
      <div className="mb-4">
        <button
          onClick={() => setShowMessage(!showMessage)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {showMessage ? '▼' : '▶'} {showMessage ? 'Hide' : 'View'} message
        </button>
        {showMessage && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap border border-blue-200">
            {message.message_text}
          </div>
        )}
      </div>

      {/* Outcome Logging UI */}
      {message.send_status === 'sent' && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Update outcome:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleOutcomeUpdate('replied')}
                disabled={isUpdating || localOutcome === 'replied'}
                className="px-4 py-2.5 md:py-2 min-h-[44px] md:min-h-0 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                💬 Replied
              </button>
              <button
                onClick={() => handleOutcomeUpdate('call_scheduled')}
                disabled={isUpdating || localOutcome === 'call_scheduled'}
                className="px-4 py-2.5 md:py-2 min-h-[44px] md:min-h-0 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                📞 Call Scheduled
              </button>
              <button
                onClick={() => handleOutcomeUpdate('customer_acquired')}
                disabled={isUpdating || localOutcome === 'customer_acquired'}
                className="px-4 py-2.5 md:py-2 min-h-[44px] md:min-h-0 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🎉 Customer!
              </button>
              <button
                onClick={() => handleOutcomeUpdate('dead_end')}
                disabled={isUpdating || localOutcome === 'dead_end'}
                className="px-4 py-2.5 md:py-2 min-h-[44px] md:min-h-0 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Dead End
              </button>
              {localOutcome && (
                <button
                  onClick={() => handleOutcomeUpdate(null)}
                  disabled={isUpdating}
                  className="px-4 py-2.5 md:py-2 min-h-[44px] md:min-h-0 bg-white text-gray-700 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Draft Actions */}
      {message.send_status === 'draft' && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">
            This message hasn&apos;t been sent yet. Go to the contacts page to send it.
          </p>
          <Link
            href={`/dashboard/opportunities/${message.pain_point.reddit_id}/contacts`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Contacts
          </Link>
        </div>
      )}
    </div>
  )
}
