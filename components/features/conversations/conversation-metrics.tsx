/**
 * Conversation Metrics Component
 *
 * Displays aggregate metrics for user's conversations:
 * - Messages sent
 * - Replies received
 * - Calls scheduled
 * - Customers acquired
 */

'use client'

interface ConversationMetricsProps {
  metrics: {
    totalSent: number
    totalReplied: number
    totalCalls: number
    totalCustomers: number
    totalDrafts: number
    awaitingResponse: number
  }
}

export function ConversationMetrics({ metrics }: ConversationMetricsProps) {
  const responseRate = metrics.totalSent > 0
    ? ((metrics.totalReplied / metrics.totalSent) * 100).toFixed(1)
    : '0.0'

  const conversionFunnel = [
    { stage: 'Sent', count: metrics.totalSent, color: 'blue' },
    { stage: 'Replied', count: metrics.totalReplied, color: 'green' },
    { stage: 'Calls', count: metrics.totalCalls, color: 'purple' },
    { stage: 'Customers', count: metrics.totalCustomers, color: 'yellow' }
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Messages Sent */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Messages Sent</span>
            <span className="text-2xl">📤</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{metrics.totalSent}</div>
          {metrics.awaitingResponse > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {metrics.awaitingResponse} awaiting response
            </p>
          )}
        </div>

        {/* Replies Received */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Replies Received</span>
            <span className="text-2xl">💬</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{metrics.totalReplied}</div>
          <p className="text-xs text-gray-500 mt-2">
            {responseRate}% response rate
          </p>
        </div>

        {/* Calls Scheduled */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Calls Scheduled</span>
            <span className="text-2xl">📞</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">{metrics.totalCalls}</div>
          {metrics.totalReplied > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {((metrics.totalCalls / metrics.totalReplied) * 100).toFixed(0)}% of replies
            </p>
          )}
        </div>

        {/* Customers Acquired */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Customers</span>
            <span className="text-2xl">🎉</span>
          </div>
          <div className="text-3xl font-bold text-yellow-600">{metrics.totalCustomers}</div>
          {metrics.totalSent > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {((metrics.totalCustomers / metrics.totalSent) * 100).toFixed(1)}% conversion
            </p>
          )}
        </div>
      </div>

      {/* Conversion Funnel Visualization */}
      {metrics.totalSent > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {conversionFunnel.map((stage) => {
              const percentage = metrics.totalSent > 0
                ? (stage.count / metrics.totalSent) * 100
                : 0

              const colorClasses = {
                blue: 'bg-blue-600',
                green: 'bg-green-600',
                purple: 'bg-purple-600',
                yellow: 'bg-yellow-600'
              }

              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-gray-600">
                      {stage.count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${colorClasses[stage.color as keyof typeof colorClasses]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Momentum Message */}
          {metrics.totalSent >= 5 && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>🚀 Building momentum!</strong> You&apos;ve sent {metrics.totalSent} messages.
                {metrics.totalReplied === 0 && " Keep going - replies typically come within 24-48 hours."}
                {metrics.totalReplied > 0 && ` ${metrics.totalReplied} people are already interested!`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Drafts Notice */}
      {metrics.totalDrafts > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h4 className="font-semibold text-orange-900 mb-1">
                {metrics.totalDrafts} Draft {metrics.totalDrafts === 1 ? 'Message' : 'Messages'}
              </h4>
              <p className="text-sm text-orange-800">
                You have unsent draft messages. Complete sending them to start conversations!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
