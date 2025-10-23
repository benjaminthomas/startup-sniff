/**
 * Epic 2 Validation Dashboard - Story 2.12
 *
 * Displays key success metrics to determine if Epic 2 is meeting goals:
 * - Free-to-paid conversion rate
 * - Message send rate
 * - Template response rate
 * - Monthly Recurring Revenue (MRR)
 * - Churn rate
 */

import { PageHeader } from "@/components/ui/page-header";
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { redirect } from 'next/navigation';
import {
  Check,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  MessageSquare,
  Target,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { calculateEpic2Metrics, getMetricStatus } from '@/lib/analytics/epic2-metrics';

export const metadata = {
  title: 'Epic 2 Metrics | StartupSniff',
  description: 'Track Epic 2 success metrics and validation status'
};

export default async function Epic2MetricsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/auth/signin');
  }

  // Calculate Epic 2 metrics
  const metrics = await calculateEpic2Metrics(30);

  // Get recommendation colors
  const recommendationColor =
    metrics.recommendation.status === 'PROCEED_TO_EPIC_3' ? 'green' :
    metrics.recommendation.status === 'ITERATE' ? 'yellow' : 'red';

  const recommendationColors = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600'
    }
  }[recommendationColor];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Epic 2 Validation Dashboard"
        description="Track paid feature metrics and determine readiness for Epic 3"
      />

      {/* Overall Recommendation */}
      <div className={`${recommendationColors.bg} border ${recommendationColors.border} rounded-lg p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${recommendationColors.text} mb-2`}>
              {metrics.recommendation.status.replace(/_/g, ' ')}
            </h2>
            <p className="text-gray-700 mb-4">{metrics.recommendation.message}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" />
                {metrics.recommendation.greenCount} Green
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                {metrics.recommendation.yellowCount} Yellow
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-600" />
                {metrics.recommendation.redCount} Red
              </span>
            </div>
          </div>
          {metrics.recommendation.status === 'PROCEED_TO_EPIC_3' && (
            <ArrowRight className={`w-12 h-12 ${recommendationColors.icon}`} />
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free-to-Paid Conversion */}
        <MetricCard
          name="Free-to-Paid Conversion"
          value={`${metrics.freeToPaidConversion.rate}%`}
          target={metrics.freeToPaidConversion.target}
          zone={metrics.freeToPaidConversion.zone}
          icon={Users}
          description={`${metrics.freeToPaidConversion.total} users converted to paid plans`}
        />

        {/* Message Send Rate */}
        <MetricCard
          name="Message Send Rate"
          value={`${metrics.messageSendRate.rate}%`}
          target={metrics.messageSendRate.target}
          zone={metrics.messageSendRate.zone}
          icon={MessageSquare}
          description={`${metrics.messageSendRate.totalSent} messages sent by paid users`}
        />

        {/* Response Rate */}
        <MetricCard
          name="Response Rate"
          value={`${metrics.responseRate.rate}%`}
          target={metrics.responseRate.target}
          zone={metrics.responseRate.zone}
          icon={Target}
          description={`${metrics.responseRate.totalReplies} replies received from sent messages`}
        />

        {/* MRR */}
        <MetricCard
          name="Monthly Recurring Revenue"
          value={`$${metrics.mrr.amount}`}
          target={metrics.mrr.target}
          zone={metrics.mrr.zone}
          icon={DollarSign}
          description={`${metrics.mrr.subscribers} active paying subscribers`}
        />

        {/* Churn Rate */}
        <MetricCard
          name="Churn Rate"
          value={`${metrics.churnRate.rate}%`}
          target={metrics.churnRate.target}
          zone={metrics.churnRate.zone}
          icon={TrendingUp}
          description={`${metrics.churnRate.churned} subscriptions cancelled`}
        />
      </div>

      {/* Cohort Analysis */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Cohort Analysis by Plan Type</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan Type</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Users</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Messages Sent</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Response Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.cohorts.byPlanType.map((cohort) => (
                <tr key={cohort.planType} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium capitalize">
                    {cohort.planType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 text-right">{cohort.users}</td>
                  <td className="py-3 px-4 text-right">{cohort.messagesSent}</td>
                  <td className="py-3 px-4 text-right">{cohort.avgResponseRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {metrics.cohorts.byPlanType.every(c => c.users === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No user data available yet. Data will appear once users start signing up.</p>
          </div>
        )}
      </div>

      {/* Zone Criteria Reference */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Success Criteria</h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <span className="font-semibold text-green-700">GREEN Zone:</span>
              <span className="text-gray-700"> 4+ green metrics = Ready to proceed to Epic 3 (Network Intelligence). Epic 2 shows strong monetization.</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <span className="font-semibold text-yellow-700">YELLOW Zone:</span>
              <span className="text-gray-700"> Mixed results = Iterate for 2-4 weeks. Optimize templates, pricing, or user onboarding to improve metrics.</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <span className="font-semibold text-red-700">RED Zone:</span>
              <span className="text-gray-700"> 3+ red metrics = Pivot required. Critical issues with monetization strategy or product-market fit.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          <strong>Reporting Period:</strong> {metrics.timeRange}
        </p>
        <p className="mt-1">
          <strong>Last Updated:</strong> {new Date(metrics.calculatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  name,
  value,
  target,
  zone,
  icon: Icon,
  description
}: {
  name: string;
  value: string;
  target: string;
  zone: 'GREEN' | 'YELLOW' | 'RED';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  const status = getMetricStatus(zone);
  const zoneIcon = zone === 'GREEN' ? Check : zone === 'YELLOW' ? AlertTriangle : XCircle;
  const ZoneIcon = zoneIcon;

  return (
    <div className={`${status.bgColor} border ${status.borderColor} rounded-lg p-6`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${status.color}`} />
          <h3 className="font-semibold text-gray-900">{name}</h3>
        </div>
        <ZoneIcon className={`w-5 h-5 ${status.color}`} />
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-600">
          Target: {target}
        </div>
      </div>

      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
