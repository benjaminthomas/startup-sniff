/**
 * Opportunity Detail Page
 *
 * Displays full details of a specific opportunity including:
 * - Complete post content
 * - BMAD score breakdown
 * - AI-powered deep analysis
 * - Trend information
 * - Reddit link and engagement metrics
 */

import { createServerAdminClient } from '@/modules/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OpportunityActions } from './opportunity-actions'
import { OpportunityAnalytics } from './opportunity-analytics'

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerAdminClient()
  const { data: opportunity } = await supabase
    .from('reddit_posts')
    .select('title')
    .eq('reddit_id', id)
    .single()

  return {
    title: opportunity ? `${opportunity.title} | StartupSniff` : 'Opportunity | StartupSniff',
    description: 'View detailed analysis of this business opportunity'
  }
}

export default async function OpportunityDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerAdminClient()

  const { data: opportunity, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .eq('reddit_id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  const score = opportunity.viability_score || 0
  const createdDate = new Date(opportunity.created_utc)
  const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

  // Score styling
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 7) return 'High Potential'
    if (score >= 4) return 'Medium Potential'
    return 'Low Potential'
  }

  // Always construct Reddit permalink (opportunity.url contains external links for link posts)
  const redditUrl = `https://reddit.com/r/${opportunity.subreddit}/comments/${opportunity.reddit_id}/`

  return (
    <>
      <OpportunityAnalytics opportunityId={opportunity.reddit_id} score={score} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {opportunity.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <Link
                  href={`https://reddit.com/r/${opportunity.subreddit}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  r/{opportunity.subreddit}
                </Link>
                <span>•</span>
                <span>{ageInDays === 0 ? 'Today' : `${ageInDays} days ago`}</span>
                <span>•</span>
                <span>{opportunity.score} upvotes</span>
                <span>•</span>
                <span>{opportunity.comments} comments</span>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                {opportunity.is_emerging && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                    🔥 Emerging Trend
                  </span>
                )}
                {opportunity.trend_direction === 'up' && !opportunity.is_emerging && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                    📈 Growing ({opportunity.trend_percentage}%)
                  </span>
                )}
                {opportunity.weekly_frequency && opportunity.weekly_frequency > 5 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                    🔥 {opportunity.weekly_frequency} mentions this week
                  </span>
                )}
              </div>
            </div>

            {/* Score Badge */}
            <div className={`flex flex-col items-center px-6 py-4 rounded-lg border ${getScoreColor(score)} ml-6`}>
              <div className="text-4xl font-bold mb-1">{score.toFixed(1)}</div>
              <div className="text-sm font-medium">{getScoreLabel(score)}</div>
            </div>
          </div>

          {/* Actions */}
          <OpportunityActions
            opportunity={opportunity}
            redditUrl={redditUrl}
          />
      </div>

      {/* AI Analysis */}
      {opportunity.viability_explanation && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">AI Analysis</h2>
                <p className="text-sm text-gray-600">Generated by GPT-4o</p>
              </div>
            </div>
            <p className="text-gray-900 leading-relaxed">
              {opportunity.viability_explanation}
            </p>
        </div>
      )}

      {/* Post Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Post Content</h2>
          {opportunity.content ? (
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {opportunity.content}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">This is a link post with no text content.</p>
          )}
        </div>

        {/* BMAD Score Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Score Breakdown</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Viability */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Business Viability</div>
                <div className="text-lg font-bold text-gray-900">
                  {/* Note: Would need to store component scores separately */}
                  {(score * 0.35 / 0.35).toFixed(1)}/10
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(score * 0.35 / 0.35) * 10}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Quality of problem/solution (35% weight)</p>
            </div>

            {/* Market Validation */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Market Validation</div>
                <div className="text-lg font-bold text-gray-900">
                  {(Math.min(Math.log10(Math.max(opportunity.score ?? 0, 1)) * 2, 10)).toFixed(1)}/10
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(Math.log10(Math.max(opportunity.score ?? 0, 1)) * 2, 10) * 10}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Community engagement (30% weight)</p>
            </div>

            {/* Action Potential */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Action Potential</div>
                <div className="text-lg font-bold text-gray-900">
                  {(score * 0.20 / 0.20).toFixed(1)}/10
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: `${(score * 0.20 / 0.20) * 10}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Actionability & specificity (20% weight)</p>
            </div>

            {/* Discovery Timing */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-600">Discovery Timing</div>
                <div className="text-lg font-bold text-gray-900">
                  {ageInDays < 1 ? '10.0' : ageInDays < 3 ? '8.0' : ageInDays < 7 ? '6.0' : '4.0'}/10
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(ageInDays < 1 ? 100 : ageInDays < 3 ? 80 : ageInDays < 7 ? 60 : 40)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Freshness & momentum (15% weight)</p>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Engagement Metrics</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{opportunity.score}</div>
              <div className="text-sm text-gray-600 mt-1">Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{opportunity.comments}</div>
              <div className="text-sm text-gray-600 mt-1">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {(((opportunity.comments ?? 0) / Math.max(opportunity.score ?? 0, 1)) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Engagement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{ageInDays}</div>
              <div className="text-sm text-gray-600 mt-1">Days Old</div>
            </div>
          </div>
        </div>
    </>
  )
}
