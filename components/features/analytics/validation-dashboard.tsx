'use client'

/**
 * Validation Dashboard Component
 * Epic 1, Story 1.12: Epic 1 Validation Dashboard
 *
 * Displays validation metrics with GREEN/YELLOW/RED zone indicators
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getValidationMetricsAction,
  getDailyMetricsTrendAction,
  type DashboardMetrics,
  type DailyMetric,
} from '@/modules/analytics/actions'
import {
  Clock,
  TrendingUp,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function ValidationDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [trendData, setTrendData] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [metricsResult, trendResult] = await Promise.all([
        getValidationMetricsAction(),
        getDailyMetricsTrendAction(30),
      ])

      if (metricsResult.success && metricsResult.metrics) {
        setMetrics(metricsResult.metrics)
      } else {
        setError(metricsResult.error || 'Failed to load metrics')
      }

      if (trendResult.success && trendResult.data) {
        setTrendData(trendResult.data)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('[validation-dashboard] Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading validation metrics...</div>
  }

  if (error || !metrics) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Failed to load metrics'}</AlertDescription>
      </Alert>
    )
  }

  const overallZone = getOverallZone(metrics)

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <Card className={getZoneCardClass(overallZone)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getZoneIcon(overallZone)}
              <div>
                <CardTitle className="text-2xl">
                  Epic 1 Status: {overallZone} ZONE
                </CardTitle>
                <CardDescription className={getZoneTextClass(overallZone)}>
                  {getZoneRecommendation(overallZone)}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Validation Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Session Duration"
          metric={metrics.avgSessionDuration}
          icon={<Clock className="h-5 w-5" />}
          formatValue={(v) => `${Math.floor(v / 60)}m ${v % 60}s`}
        />
        <MetricCard
          title="7-Day Return Rate"
          metric={metrics.sevenDayReturnRate}
          icon={<TrendingUp className="h-5 w-5" />}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
        <MetricCard
          title="Opportunities/Session"
          metric={metrics.opportunitiesPerSession}
          icon={<Target className="h-5 w-5" />}
          formatValue={(v) => v.toFixed(2)}
        />
        <MetricCard
          title="Bounce Rate"
          metric={metrics.bounceRate}
          icon={<Users className="h-5 w-5" />}
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
      </div>

      {/* Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Duration Trend</CardTitle>
            <CardDescription>Average session duration over last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <XAxis
                  dataKey="metric_date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  formatter={(value: number) => [`${Math.floor(value / 60)}m ${value % 60}s`, 'Duration']}
                />
                <Line
                  type="monotone"
                  dataKey="avg_session_duration_seconds"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunities Per Session</CardTitle>
            <CardDescription>Average opportunities viewed per session</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <XAxis
                  dataKey="metric_date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                  formatter={(value: number) => [value.toFixed(2), 'Opportunities']}
                />
                <Line
                  type="monotone"
                  dataKey="avg_opportunities_per_session"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">First-time visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Returning Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.returningUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Repeat visitors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  metric,
  icon,
  formatValue,
}: {
  title: string
  metric: DashboardMetrics[keyof DashboardMetrics] & { zone?: string }
  icon: React.ReactNode
  formatValue: (value: number) => string
}) {
  if (typeof metric !== 'object' || !('zone' in metric)) {
    return null
  }

  const zone = metric.zone as 'GREEN' | 'YELLOW' | 'RED'

  return (
    <Card className={`${getZoneCardClass(zone)} border-2`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(metric.current_value)}</div>
        <div className="mt-2 flex items-center gap-1 text-xs">
          {getZoneIcon(zone, 'h-3 w-3')}
          <span className={getZoneTextClass(zone)}>
            {zone} (Target: {formatValue(metric.green_threshold)})
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Yellow: {formatValue(metric.yellow_threshold)}, Red: {formatValue(metric.red_threshold)}
        </div>
      </CardContent>
    </Card>
  )
}

function getOverallZone(metrics: DashboardMetrics): 'GREEN' | 'YELLOW' | 'RED' {
  const zones = [
    metrics.avgSessionDuration.zone,
    metrics.sevenDayReturnRate.zone,
    metrics.opportunitiesPerSession.zone,
    metrics.bounceRate.zone,
  ]

  // Overall zone is the worst zone among all metrics
  if (zones.includes('RED')) return 'RED'
  if (zones.includes('YELLOW')) return 'YELLOW'
  return 'GREEN'
}

function getZoneIcon(zone: 'GREEN' | 'YELLOW' | 'RED', className = 'h-6 w-6') {
  switch (zone) {
    case 'GREEN':
      return <CheckCircle className={`${className} text-green-600`} />
    case 'YELLOW':
      return <AlertTriangle className={`${className} text-yellow-600`} />
    case 'RED':
      return <XCircle className={`${className} text-red-600`} />
  }
}

function getZoneCardClass(zone: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (zone) {
    case 'GREEN':
      return 'border-green-200 bg-green-50/50'
    case 'YELLOW':
      return 'border-yellow-200 bg-yellow-50/50'
    case 'RED':
      return 'border-red-200 bg-red-50/50'
  }
}

function getZoneTextClass(zone: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (zone) {
    case 'GREEN':
      return 'text-green-700'
    case 'YELLOW':
      return 'text-yellow-700'
    case 'RED':
      return 'text-red-700'
  }
}

function getZoneRecommendation(zone: 'GREEN' | 'YELLOW' | 'RED'): string {
  switch (zone) {
    case 'GREEN':
      return 'Epic 1 validation criteria met. Proceed to Epic 2 enhancement or validation.'
    case 'YELLOW':
      return 'Some metrics need attention. Monitor closely and consider optimizations.'
    case 'RED':
      return 'Critical metrics below threshold. Investigate and address issues before proceeding.'
  }
}
