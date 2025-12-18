/**
 * Conversation Tracking Dashboard - Epic 2, Story 2.6
 *
 * Shows aggregate metrics and individual message tracking
 * for all user conversations with Reddit contacts.
 */

import { createServerAdminClient } from '@/features/supabase/server'
import { getCurrentSession } from '@/features/auth/services/jwt'
import { redirect } from 'next/navigation'
import { enforcePaidAccess } from '@/features/billing/utils/paywall'
import { ConversationMetrics } from '@/features/conversations/components/conversation-metrics'
import { MessageList } from '@/features/conversations/components/message-list'
import Link from 'next/link'
import { log } from '@/lib/logger'
import type { Message } from '@/types/supabase'

// Type for messages with joined contact and pain_point data
type MessageWithRelations = Message & {
  contact: {
    reddit_username: string
    post_excerpt: string | null
    karma: number | null
    engagement_score: number
  } | null
  pain_point: {
    reddit_id: string
    title: string
    subreddit: string
  } | null
}

export const metadata = {
  title: 'My Conversations | StartupSniff',
  description: 'Track your outreach conversations and outcomes'
}

export default async function ConversationsPage() {
  // Check authentication
  const session = await getCurrentSession()
  if (!session) {
    redirect('/auth/signin')
  }

  // Enforce paid access - redirects to billing page if user is on free plan
  await enforcePaidAccess('conversations')

  const supabase = createServerAdminClient()

  // Fetch all messages for this user with related data
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      contact:reddit_contacts!inner(
        reddit_username,
        post_excerpt,
        karma,
        engagement_score
      ),
      pain_point:reddit_posts!inner(
        reddit_id,
        title,
        subreddit
      )
    `)
    .eq('user_id', session.userId)
    .order('sent_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    log.error('[conversations] Error fetching messages:', error)
  }

  const userMessages = (messages || []) as MessageWithRelations[]

  // Calculate aggregate metrics
  const metrics = {
    totalSent: userMessages.filter(m => m.send_status === 'sent').length,
    totalReplied: userMessages.filter(m => m.outcome === 'replied').length,
    totalCalls: userMessages.filter(m => m.outcome === 'call_scheduled').length,
    totalCustomers: userMessages.filter(m => m.outcome === 'customer_acquired').length,
    totalDrafts: userMessages.filter(m => m.send_status === 'draft').length,
    awaitingResponse: userMessages.filter(m =>
      m.send_status === 'sent' &&
      !m.outcome
    ).length
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          My Conversations
        </h1>
        <p className="text-gray-600">
          Track your outreach progress and log conversation outcomes
        </p>
      </div>

      {/* Aggregate Metrics */}
      <ConversationMetrics metrics={metrics} />

      {/* Message List */}
      <MessageList messages={userMessages} />

      {/* Empty State */}
      {userMessages.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No conversations yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by discovering pain points and sending your first messages
          </p>
          <Link
            href="/dashboard/opportunities"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore Opportunities
          </Link>
        </div>
      )}
    </>
  )
}
