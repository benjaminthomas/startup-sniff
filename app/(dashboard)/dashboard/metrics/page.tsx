import { PageHeader } from "@/components/ui/page-header"
import { createServerAdminClient } from '@/modules/supabase/server'
import { Check, AlertTriangle, XCircle, TrendingUp, Users, Target, Clock, BarChart3, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Epic 1 Metrics | StartupSniff',
  description: 'Track Epic 1 success metrics and validation status'
}

// Zone thresholds
const THRESHOLDS = {
  avgSessionTime: { green: 120, yellow: 60 }, // seconds
  returnRate: { green: 25, yellow: 15 }, // percentage
  opportunitiesPerSession: { green: 2, yellow: 1 }, // count
  bounceRate: { green: 60, yellow: 75 } // percentage (lower is better)
}

type ZoneType = 'green' | 'yellow' | 'red'

function getZone(value: number, threshold: { green: number, yellow: number }, lowerIsBetter = false): ZoneType {
  if (lowerIsBetter) {
    if (value <= threshold.green) return 'green'
    if (value <= threshold.yellow) return 'yellow'
    return 'red'
  } else {
    if (value >= threshold.green) return 'green'
    if (value >= threshold.yellow) return 'yellow'
    return 'red'
  }
}

function getZoneColor(zone: ZoneType) {
  switch (zone) {
    case 'green':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: 'text-green-600'
      }
    case 'yellow':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: 'text-yellow-600'
      }
    case 'red':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-600'
      }
  }
}

function getZoneIcon(zone: ZoneType) {
  switch (zone) {
    case 'green':
      return Check
    case 'yellow':
      return AlertTriangle
    case 'red':
      return XCircle
  }
}

export default async function MetricsPage() {
  const supabase = createServerAdminClient()

  // Get basic stats
  const { data: users } = await supabase
    .from('users')
    .select('id, created_at')
    .order('created_at', { ascending: false })

  const { data: opportunities } = await supabase
    .from('reddit_posts')
    .select('viability_score')
    .not('viability_score', 'is', null)
    .not('reddit_id', 'like', 'test_%')

  // Calculate metrics
  const totalUsers = users?.length || 0
  const totalOpportunities = opportunities?.length || 0
  const highPotential = opportunities?.filter(o => o.viability_score && o.viability_score >= 7).length || 0

  // Calculate 7-day return rate (simplified - based on user creation dates)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentUsers = users?.filter(u => new Date(u.created_at) >= sevenDaysAgo).length || 0

  // Placeholder metrics (will be replaced with real analytics)
  const avgSessionTime = 145 // seconds - placeholder
  const returnRate = 18 // percentage - placeholder
  const opportunitiesPerSession = 2.3 // count - placeholder
  const bounceRate = 52 // percentage - placeholder

  // Calculate zones
  const sessionZone = getZone(avgSessionTime, THRESHOLDS.avgSessionTime)
  const returnZone = getZone(returnRate, THRESHOLDS.returnRate)
  const opportunitiesZone = getZone(opportunitiesPerSession, THRESHOLDS.opportunitiesPerSession)
  const bounceZone = getZone(bounceRate, THRESHOLDS.bounceRate, true)

  // Overall assessment
  const greenCount = [sessionZone, returnZone, opportunitiesZone, bounceZone].filter(z => z === 'green').length
  const redCount = [sessionZone, returnZone, opportunitiesZone, bounceZone].filter(z => z === 'red').length

  let overallZone: ZoneType
  let recommendation: string
  let recommendationDetail: string

  if (greenCount >= 3) {
    overallZone = 'green'
    recommendation = 'PROCEED TO EPIC 2'
    recommendationDetail = 'Epic 1 has achieved success criteria. Ready to build paid features.'
  } else if (redCount >= 2) {
    overallZone = 'red'
    recommendation = 'ITERATE OR PIVOT'
    recommendationDetail = 'Epic 1 needs significant improvement. Consider core value proposition changes.'
  } else {
    overallZone = 'yellow'
    recommendation = 'ITERATE FOR 2-4 WEEKS'
    recommendationDetail = 'Epic 1 shows promise but needs optimization before investing in paid features.'
  }

  const overallColors = getZoneColor(overallZone)

  // Metrics data
  const metrics = [
    {
      name: 'Average Session Time',
      value: `${Math.floor(avgSessionTime / 60)}m ${avgSessionTime % 60}s`,
      target: '>2 min',
      zone: sessionZone,
      icon: Clock,
      description: 'Time users spend exploring opportunities per session'
    },
    {
      name: '7-Day Return Rate',
      value: `${returnRate}%`,
      target: '>25%',
      zone: returnZone,
      icon: Users,
      description: 'Percentage of users who return within 7 days'
    },
    {
      name: 'Opportunities Per Session',
      value: opportunitiesPerSession.toFixed(1),
      target: '>2',
      zone: opportunitiesZone,
      icon: Target,
      description: 'Average number of pain points explored per session'
    },
    {
      name: 'Bounce Rate',
      value: `${bounceRate}%`,
      target: '<60%',
      zone: bounceZone,
      icon: TrendingUp,
      description: 'Percentage of users leaving within 60 seconds (lower is better)'
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Epic 1 Validation Dashboard"
        description="Track success metrics and determine readiness for Epic 2"
      />

      {/* Overall Status */}
      <div className={`${overallColors.bg} border ${overallColors.border} rounded-lg p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${overallColors.text} mb-2`}>
              {recommendation}
            </h2>
            <p className="text-gray-700 mb-4">{recommendationDetail}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" />
                {greenCount} Green
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                {4 - greenCount - redCount} Yellow
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-600" />
                {redCount} Red
              </span>
            </div>
          </div>
          {overallZone === 'green' && (
            <ArrowRight className={`w-12 h-12 ${overallColors.icon}`} />
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const colors = getZoneColor(metric.zone)
          const Icon = metric.icon
          const ZoneIcon = getZoneIcon(metric.zone)

          return (
            <div
              key={metric.name}
              className={`${colors.bg} border ${colors.border} rounded-lg p-6`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                  <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                </div>
                <ZoneIcon className={`w-5 h-5 ${colors.icon}`} />
              </div>

              <div className="mb-2">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">
                  Target: {metric.target}
                </div>
              </div>

              <p className="text-sm text-gray-600">{metric.description}</p>
            </div>
          )
        })}
      </div>

      {/* Platform Stats */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Platform Statistics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Users</div>
            <div className="text-3xl font-bold mt-1">{totalUsers}</div>
            <div className="text-xs text-gray-500 mt-1">
              {recentUsers} in last 7 days
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Opportunities Scored</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{totalOpportunities}</div>
            <div className="text-xs text-gray-500 mt-1">
              AI-analyzed pain points
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">High Potential (≥7.0)</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{highPotential}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalOpportunities > 0 ? ((highPotential / totalOpportunities) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Zone Criteria Reference */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Success Criteria</h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <span className="font-semibold text-green-700">GREEN Zone:</span>
              <span className="text-gray-700"> Ready to proceed to Epic 2 (paid features). Metrics show strong product-market fit.</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <span className="font-semibold text-yellow-700">YELLOW Zone:</span>
              <span className="text-gray-700"> Needs 2-4 weeks of iteration. A/B test features, improve UX, optimize performance.</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <span className="font-semibold text-red-700">RED Zone:</span>
              <span className="text-gray-700"> Fundamental issues with value proposition. Consider pivot or significant changes before Epic 2.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Note about metrics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          <strong>Note:</strong> Some metrics are currently placeholder values and will be replaced with real analytics data once tracking is fully implemented.
          This dashboard provides a framework for Epic 1 validation based on the technical specification criteria.
        </p>
      </div>
    </div>
  )
}
