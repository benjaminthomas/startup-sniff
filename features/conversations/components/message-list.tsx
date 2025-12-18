/**
 * Message List Component (Standalone)
 *
 * Displays individual messages with status and outcome tracking
 * Uses dependency injection for actions
 */

'use client'

import { useState } from 'react'
import { MessageCard } from './message-card'
import { updateMessageOutcomeAction } from '@/features/conversations/actions/update-message-outcome'
import type { MessageCardData, UpdateMessageOutcomeHandler } from '@/types/components'

interface MessageListProps {
  messages: MessageCardData[]
  onUpdateOutcome?: UpdateMessageOutcomeHandler
}

export function MessageList({ messages, onUpdateOutcome = updateMessageOutcomeAction }: MessageListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOutcome, setFilterOutcome] = useState<string>('all')

  // Filter messages
  const filteredMessages = messages.filter(message => {
    if (filterStatus !== 'all' && message.send_status !== filterStatus) {
      return false
    }
    if (filterOutcome === 'no_outcome') {
      return message.send_status === 'sent' && !message.outcome
    }
    if (filterOutcome !== 'all' && message.outcome !== filterOutcome) {
      return false
    }
    return true
  })

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Outcome:</label>
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-3 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Outcomes</option>
              <option value="no_outcome">Awaiting Response</option>
              <option value="replied">Replied</option>
              <option value="call_scheduled">Call Scheduled</option>
              <option value="customer_acquired">Customer Acquired</option>
              <option value="dead_end">Dead End</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredMessages.length} of {messages.length} messages
          </div>
        </div>
      </div>

      {/* Message Cards */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <MessageCard key={message.id} message={message} onUpdateOutcome={onUpdateOutcome} />
        ))}
      </div>

      {/* No Results */}
      {filteredMessages.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-4xl mb-3">🔍</div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No messages match your filters</h4>
          <p className="text-gray-600">
            Try adjusting your filters to see more messages
          </p>
        </div>
      )}
    </div>
  )
}
