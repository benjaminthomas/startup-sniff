import { PageHeader } from "@/components/ui/page-header"
import { OpportunitiesContent } from "./opportunities-content"
import { createServerAdminClient } from '@/modules/supabase/server'
import { log } from '@/lib/logger'

export const metadata = {
  title: 'Opportunities | StartupSniff',
  description: 'Discover high-potential startup opportunities from Reddit'
}

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = createServerAdminClient()

  // Get filter parameters
  const minScore = params.minScore ? Number(params.minScore) : 1
  const subreddit = params.subreddit as string | undefined
  const trend = params.trend as string | undefined
  const search = params.search as string | undefined
  const sortBy = (params.sortBy as string) || 'score'

  // Build query with admin client to see all posts
  let query = supabase
    .from('reddit_posts')
    .select('*')
    .gte('viability_score', minScore)
    .not('viability_score', 'is', null)
    .not('reddit_id', 'like', 'test_%') // Exclude test posts

  // Apply filters
  if (subreddit && subreddit !== 'all') {
    query = query.eq('subreddit', subreddit)
  }

  if (trend === 'emerging') {
    query = query.eq('is_emerging', true)
  } else if (trend === 'growing') {
    query = query.eq('trend_direction', 'up')
  }

  // Apply search
  if (search) {
    query = query.textSearch('search_vector', search, {
      type: 'websearch',
      config: 'english'
    })
  }

  // Apply sorting
  switch (sortBy) {
    case 'score':
      query = query.order('viability_score', { ascending: false })
      break
    case 'date':
      query = query.order('created_utc', { ascending: false })
      break
    case 'engagement':
      query = query.order('score', { ascending: false })
      break
    default:
      query = query.order('viability_score', { ascending: false })
  }

  query = query.limit(50)

  const { data: opportunities, error } = await query

  if (error) {
    log.error('Error fetching opportunities:', error)
  }

  // Get filter options
  const { data: subreddits } = await supabase
    .from('reddit_posts')
    .select('subreddit')
    .not('viability_score', 'is', null)
    .not('reddit_id', 'like', 'test_%') // Exclude test posts
    .order('subreddit')

  const uniqueSubreddits = Array.from(
    new Set(subreddits?.map(s => s.subreddit) || [])
  )

  // Get statistics
  const { data: stats } = await supabase
    .from('reddit_posts')
    .select('viability_score')
    .not('viability_score', 'is', null)
    .not('reddit_id', 'like', 'test_%') // Exclude test posts

  const totalOpportunities = stats?.length || 0
  const highPotential = stats?.filter(s => s.viability_score && s.viability_score >= 7).length || 0
  const avgScore = stats && stats.length > 0
    ? stats.reduce((sum, s) => sum + (s.viability_score || 0), 0) / stats.length
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Opportunities"
        description="Discover high-potential startup ideas from Reddit discussions"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Opportunities</div>
          <div className="text-3xl font-bold mt-1">{totalOpportunities}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">High Potential (≥7.0)</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{highPotential}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Score</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{avgScore.toFixed(2)}</div>
        </div>
      </div>

      <OpportunitiesContent
        opportunities={opportunities || []}
        subreddits={uniqueSubreddits}
        currentFilters={{
          minScore,
          subreddit: subreddit || 'all',
          trend: trend || 'all',
          search: search || '',
          sortBy
        }}
      />
    </div>
  )
}
