'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RedditContact } from '@/types/supabase'
import { MessageTemplatePreview } from '../messages/message-template-preview'

interface ContactCardProps {
  contact: RedditContact
  hasRedditConnected?: boolean
}

/**
 * ContactCard Component (Epic 2: Human Discovery)
 *
 * Displays a discovered Reddit user with:
 * - Username and profile link
 * - Engagement score (ranked by karma, posting frequency, account age)
 * - Post excerpt showing why they're relevant
 * - Key metrics (karma, account age)
 * - Epic 2.3: Generate Message button
 */
export function ContactCard({ contact, hasRedditConnected = false }: ContactCardProps) {
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  // Format account age
  const formatAccountAge = (days: number): string => {
    if (days < 30) return `${days} days`
    if (days < 365) return `${Math.floor(days / 30)} months`
    return `${Math.floor(days / 365)} years`
  }

  // Format karma with commas
  const formatKarma = (karma: number): string => {
    return karma.toLocaleString()
  }

  // Get engagement score color
  const getScoreColor = (score: number): string => {
    if (score >= 10) return 'bg-green-100 text-green-800 border-green-300'
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  // Get engagement label
  const getEngagementLabel = (score: number): string => {
    if (score >= 10) return 'Highly Active'
    if (score >= 5) return 'Moderately Active'
    return 'Less Active'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all">
      {/* Header: Username + Engagement Score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            href={`https://reddit.com/user/${contact.reddit_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            u/{contact.reddit_username}
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            {formatAccountAge(contact.account_age_days)} on Reddit
          </p>
        </div>

        {/* Engagement Score Badge */}
        <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${getScoreColor(contact.engagement_score)}`}>
          <div className="text-xl font-bold">{contact.engagement_score.toFixed(1)}</div>
          <div className="text-xs font-medium whitespace-nowrap">{getEngagementLabel(contact.engagement_score)}</div>
        </div>
      </div>

      {/* Post Excerpt */}
      {contact.post_excerpt && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-3 bg-gray-50 p-3 rounded-md border border-gray-200">
            &quot;{contact.post_excerpt}&quot;
          </p>
        </div>
      )}

      {/* User Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{formatKarma(contact.karma)}</div>
          <div className="text-xs text-gray-500">Karma</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{(contact.posting_frequency ?? 0).toFixed(1)}</div>
          <div className="text-xs text-gray-500">Posts/Week</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{formatAccountAge(contact.account_age_days)}</div>
          <div className="text-xs text-gray-500">Age</div>
        </div>
      </div>

      {/* Why This Person? */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 text-lg">💡</div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Why This Person?</p>
            <p className="text-sm text-gray-700">
              {contact.engagement_score >= 10 ? (
                <>Highly active user with strong community presence. Posted about similar pain points recently.</>
              ) : contact.engagement_score >= 5 ? (
                <>Active community member who has posted about related problems. Good engagement potential.</>
              ) : (
                <>Posted about this pain point. May be interested in solutions.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* View Profile Link */}
      <div className="mt-4">
        <Link
          href={`https://reddit.com/user/${contact.reddit_username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View full Reddit profile →
        </Link>
      </div>

      {/* Epic 2.3: Generate Message Button */}
      {hasRedditConnected && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowTemplatePreview(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md font-semibold text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Generate Message
          </button>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <MessageTemplatePreview
          contactId={contact.id}
          contactUsername={contact.reddit_username}
          onClose={() => setShowTemplatePreview(false)}
        />
      )}
    </div>
  )
}
