'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { RedditPost } from '@/types/supabase'
import {
  trackFilterApplied,
  trackSearchPerformed,
  trackOpportunityViewed,
  incrementOpportunitiesViewed,
  incrementFiltersApplied
} from '@/lib/analytics'

interface OpportunitiesContentProps {
  opportunities: RedditPost[]
  subreddits: string[]
  currentFilters: {
    minScore: number
    subreddit: string
    trend: string
    search: string
    sortBy: string
  }
}

export function OpportunitiesContent({
  opportunities,
  subreddits,
  currentFilters
}: OpportunitiesContentProps) {
  const router = useRouter()

  const [filters, setFilters] = useState(currentFilters)

  const applyFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    // Track filter usage
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === 'search' && value) {
        trackSearchPerformed(value as string, opportunities.length)
      } else if (value !== undefined && value !== filters[key as keyof typeof filters]) {
        trackFilterApplied(key, String(value))
        incrementFiltersApplied()
      }
    })

    // Build query string
    const params = new URLSearchParams()
    if (updated.minScore > 1) params.set('minScore', updated.minScore.toString())
    if (updated.subreddit !== 'all') params.set('subreddit', updated.subreddit)
    if (updated.trend !== 'all') params.set('trend', updated.trend)
    if (updated.search) params.set('search', updated.search)
    if (updated.sortBy !== 'score') params.set('sortBy', updated.sortBy)

    router.push(`/dashboard/opportunities?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Score Filter */}
          <div>
            <label htmlFor="minScore" className="block text-sm font-medium text-gray-700 mb-1">
              Min Score
            </label>
            <select
              id="minScore"
              value={filters.minScore}
              onChange={(e) => applyFilters({ minScore: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">All (≥1.0)</option>
              <option value="4">Medium+ (≥4.0)</option>
              <option value="7">High (≥7.0)</option>
              <option value="8">Very High (≥8.0)</option>
            </select>
          </div>

          {/* Subreddit Filter */}
          <div>
            <label htmlFor="subreddit" className="block text-sm font-medium text-gray-700 mb-1">
              Subreddit
            </label>
            <select
              id="subreddit"
              value={filters.subreddit}
              onChange={(e) => applyFilters({ subreddit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Subreddits</option>
              {subreddits.map(sub => (
                <option key={sub} value={sub}>r/{sub}</option>
              ))}
            </select>
          </div>

          {/* Trend Filter */}
          <div>
            <label htmlFor="trend" className="block text-sm font-medium text-gray-700 mb-1">
              Trend Status
            </label>
            <select
              id="trend"
              value={filters.trend}
              onChange={(e) => applyFilters({ trend: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Trends</option>
              <option value="emerging">🔥 Emerging</option>
              <option value="growing">📈 Growing</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) => applyFilters({ sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="score">Viability Score</option>
              <option value="date">Most Recent</option>
              <option value="engagement">Most Engaging</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search opportunities..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters({ search: filters.search })
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Active Filters */}
        {(filters.minScore > 1 || filters.subreddit !== 'all' || filters.trend !== 'all' || filters.search) && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters.minScore > 1 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm">
                Score ≥{filters.minScore}
              </span>
            )}
            {filters.subreddit !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm">
                r/{filters.subreddit}
              </span>
            )}
            {filters.trend !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm">
                {filters.trend === 'emerging' ? '🔥 Emerging' : '📈 Growing'}
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-sm">
                &quot;{filters.search}&quot;
              </span>
            )}
            <button
              onClick={() => applyFilters({
                minScore: 1,
                subreddit: 'all',
                trend: 'all',
                search: '',
                sortBy: 'score'
              })}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found <span className="font-semibold">{opportunities.length}</span> opportunities
      </div>

      {/* Opportunity Cards */}
      {opportunities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={() => applyFilters({
              minScore: 1,
              subreddit: 'all',
              trend: 'all',
              search: ''
            })}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.reddit_id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </div>
  )
}

function OpportunityCard({ opportunity }: { opportunity: RedditPost }) {
  const score = opportunity.viability_score || 0
  const createdDate = new Date(opportunity.created_utc)
  const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

  // Score color
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

  const handleClick = () => {
    trackOpportunityViewed(opportunity.reddit_id, score)
    incrementOpportunitiesViewed()
  }

  return (
    <Link
      href={`/dashboard/opportunities/${opportunity.reddit_id}`}
      onClick={handleClick}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
            {opportunity.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="font-medium">r/{opportunity.subreddit}</span>
            <span>•</span>
            <span>{ageInDays === 0 ? 'Today' : `${ageInDays}d ago`}</span>
            <span>•</span>
            <span>{opportunity.score} upvotes</span>
            <span>•</span>
            <span>{opportunity.comments} comments</span>
          </div>
        </div>

        {/* Score Badge */}
        <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${getScoreColor(score)}`}>
          <div className="text-2xl font-bold">{score.toFixed(1)}</div>
          <div className="text-xs font-medium whitespace-nowrap">{getScoreLabel(score)}</div>
        </div>
      </div>

      {/* Content Preview */}
      {opportunity.content && (
        <p className="text-gray-700 mb-4 line-clamp-3">
          {opportunity.content}
        </p>
      )}

      {/* AI Explanation */}
      {opportunity.viability_explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 text-xl">🤖</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-blue-700 uppercase mb-1">AI Analysis</div>
              <p className="text-sm text-blue-900 line-clamp-2">
                {opportunity.viability_explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {opportunity.is_emerging && (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">
            🔥 Emerging
          </span>
        )}
        {opportunity.trend_direction === 'up' && !opportunity.is_emerging && (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
            📈 Growing
          </span>
        )}
        {opportunity.weekly_frequency && opportunity.weekly_frequency > 5 && (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
            🔥 Trending ({opportunity.weekly_frequency} mentions)
          </span>
        )}
        {opportunity.url && (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
            🔗 Has Link
          </span>
        )}
      </div>

      {/* View Details Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-blue-600 font-medium hover:text-blue-700">
          View full analysis →
        </span>
      </div>
    </Link>
  )
}
