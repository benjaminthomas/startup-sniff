'use client'

/**
 * Epic 2 Validation Dashboard Component
 * Story 2.12: Epic 2 Validation Dashboard
 *
 * Real-time Epic 2 success metrics with GREEN/YELLOW/RED zone indicators
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, Minus, DollarSign, Users, Mail } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type {
  Epic2DashboardMetrics,
  Epic2DailyMetric,
  Epic2ConversionFunnel,
  Epic2ValidationMetric,
} from '@/modules/epic2-analytics/actions'
import {
  getEpic2ValidationMetricsAction,
  getEpic2DailyMetricsTrendAction,
  getEpic2ConversionFunnelAction,
} from '@/modules/epic2-analytics/actions'

export function Epic2ValidationDashboard() {
  const [metrics, setMetrics] = useState<Epic2DashboardMetrics | null>(null)
  const [trendData, setTrendData] = useState<Epic2DailyMetric[]>([])
  const [funnelData, setFunnelData] = useState<Epic2ConversionFunnel | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      setRefreshing(true)

      const [metricsResult, trendResult, funnelResult] = await Promise.all([
        getEpic2ValidationMetricsAction(),
        getEpic2DailyMetricsTrendAction(30),
        getEpic2ConversionFunnelAction(),
      ])

      if (metricsResult.success && metricsResult.metrics) {
        setMetrics(metricsResult.metrics)
      }

      if (trendResult.success && trendResult.data) {
        setTrendData(trendResult.data)
      }

      if (funnelResult.success && funnelResult.data) {
        setFunnelData(funnelResult.data)
      }
    } catch (error) {
      console.error('[epic2-dashboard] Failed to load data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Calculate overall Epic 2 status
  const getOverallZone = (): 'GREEN' | 'YELLOW' | 'RED' => {
    const zones = [
      metrics.freeToPaidConversion.zone,
      metrics.messageSendRate.zone,
      metrics.templateResponseRate.zone,
      metrics.monthlyRecurringRevenue.zone,
      metrics.churnRate.zone,
    ]

    const redCount = zones.filter((z) => z === 'RED').length
    const greenCount = zones.filter((z) => z === 'GREEN').length

    if (redCount >= 3) return 'RED'
    if (greenCount >= 3) return 'GREEN'
    return 'YELLOW'
  }

  const overallZone = getOverallZone()

  // Prepare conversion funnel chart data
  const funnelChartData = funnelData
    ? [
        { name: 'Signups', value: funnelData.signups, fill: '#3b82f6' },
        { name: 'Reddit Connected', value: funnelData.redditConnected, fill: '#8b5cf6' },
        { name: 'Contacts Discovered', value: funnelData.contactsDiscovered, fill: '#ec4899' },
        { name: 'Templates Generated', value: funnelData.templatesGenerated, fill: '#f97316' },
        { name: 'Messages Sent', value: funnelData.messagesSent, fill: '#eab308' },
        { name: 'Upgraded to Paid', value: funnelData.upgraded, fill: '#22c55e' },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className={getZoneCardClass(overallZone)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getZoneIcon(overallZone)}
              <div>
                <CardTitle className="text-2xl">Epic 2 Status: {overallZone} ZONE</CardTitle>
                <CardDescription className="text-base mt-1">
                  {getZoneMessage(overallZone)}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard metric={metrics.freeToPaidConversion} icon={<Users className="w-5 h-5" />} />
        <MetricCard metric={metrics.messageSendRate} icon={<Mail className="w-5 h-5" />} />
        <MetricCard
          metric={metrics.templateResponseRate}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          metric={metrics.monthlyRecurringRevenue}
          icon={<DollarSign className="w-5 h-5" />}
          prefix="$"
        />
        <MetricCard metric={metrics.churnRate} icon={<TrendingDown className="w-5 h-5" />} />
      </div>

      {/* User Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Free Users</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{metrics.freeUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Users</CardDescription>
            <CardTitle className="text-3xl text-green-600">{metrics.paidUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trial Users</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{metrics.trialUsers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Conversion Funnel */}
      {funnelData && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>User journey from signup to paid upgrade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={funnelChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {funnelData.signups > 0
                    ? ((funnelData.redditConnected / funnelData.signups) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground">Connect Reddit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {funnelData.signups > 0
                    ? ((funnelData.messagesSent / funnelData.signups) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground">Send Message</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {funnelData.signups > 0
                    ? ((funnelData.upgraded / funnelData.signups) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground">Upgrade</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MRR Trend */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Trend (30 Days)</CardTitle>
            <CardDescription>Monthly Recurring Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric_date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'MRR']}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorMRR)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics (30 Days)</CardTitle>
            <CardDescription>Free-to-paid and message send rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric_date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="free_to_paid_conversion_rate"
                  stroke="#3b82f6"
                  name="Free-to-Paid %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="message_send_rate"
                  stroke="#8b5cf6"
                  name="Message Send %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth (30 Days)</CardTitle>
            <CardDescription>Free vs. paid users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric_date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="paid_users"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  name="Paid Users"
                />
                <Area
                  type="monotone"
                  dataKey="free_users"
                  stackId="1"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  name="Free Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Message Activity (30 Days)</CardTitle>
            <CardDescription>Daily messages sent</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric_date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                <Bar dataKey="messages_sent_today" fill="#8b5cf6" name="Messages Sent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Messages Sent Today</CardDescription>
            <CardTitle className="text-3xl">{metrics.messagesSentToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upgrades This Month</CardDescription>
            <CardTitle className="text-3xl text-green-600">{metrics.upgradesThisMonth}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

// Helper Components

function MetricCard({
  metric,
  icon,
  prefix = '',
}: {
  metric: Epic2ValidationMetric
  icon: React.ReactNode
  prefix?: string
}) {
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'GREEN':
        return 'border-green-500 bg-green-50 dark:bg-green-950'
      case 'YELLOW':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      case 'RED':
        return 'border-red-500 bg-red-50 dark:bg-red-950'
      default:
        return ''
    }
  }

  const getTrendIcon = () => {
    if (metric.higher_is_better) {
      if (metric.zone === 'GREEN') return <TrendingUp className="w-4 h-4 text-green-600" />
      if (metric.zone === 'RED') return <TrendingDown className="w-4 h-4 text-red-600" />
    } else {
      if (metric.zone === 'GREEN') return <TrendingDown className="w-4 h-4 text-green-600" />
      if (metric.zone === 'RED') return <TrendingUp className="w-4 h-4 text-red-600" />
    }
    return <Minus className="w-4 h-4 text-yellow-600" />
  }

  return (
    <Card className={`border-l-4 ${getZoneColor(metric.zone)}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-2">
            {icon}
            {metric.metric_name}
          </CardDescription>
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {prefix}
          {metric.metric_unit === 'percentage'
            ? `${metric.current_value.toFixed(1)}%`
            : metric.current_value.toFixed(metric.metric_unit === 'dollars' ? 2 : 0)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Target: {prefix}
          {metric.green_threshold}
          {metric.metric_unit === 'percentage' ? '%' : ''}
        </p>
      </CardContent>
    </Card>
  )
}

function getZoneCardClass(zone: string): string {
  switch (zone) {
    case 'GREEN':
      return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950'
    case 'YELLOW':
      return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
    case 'RED':
      return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950'
    default:
      return ''
  }
}

function getZoneIcon(zone: string) {
  switch (zone) {
    case 'GREEN':
      return (
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
      )
    case 'YELLOW':
      return (
        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
          <Minus className="w-6 h-6 text-white" />
        </div>
      )
    case 'RED':
      return (
        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-white" />
        </div>
      )
    default:
      return null
  }
}

function getZoneMessage(zone: string): string {
  switch (zone) {
    case 'GREEN':
      return 'Epic 2 is performing well! Most metrics are in the green zone.'
    case 'YELLOW':
      return 'Epic 2 needs attention. Some metrics require optimization.'
    case 'RED':
      return 'Epic 2 requires immediate action. Multiple metrics are below targets.'
    default:
      return ''
  }
}
