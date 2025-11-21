import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Epic2ValidationDashboard } from '@/components/features/epic2-analytics/epic2-validation-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Epic 2 Validation Dashboard
 * Story 2.12: Epic 2 Validation Dashboard
 *
 * Real-time validation metrics for Epic 2 with GREEN/YELLOW/RED zone indicators
 */

export const metadata = {
  title: 'Epic 2 Validation Dashboard | StartupSniff',
  description: 'Real-time validation metrics and success indicators for Epic 2',
}

export default function Epic2ValidationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Epic 2 Validation"
        description="Real-time success metrics for conversion, messaging, and revenue"
      />

      <Suspense fallback={<Epic2ValidationDashboardSkeleton />}>
        <Epic2ValidationDashboard />
      </Suspense>
    </div>
  )
}

function Epic2ValidationDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Skeleton className="h-32" />

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Funnel Chart */}
      <Skeleton className="h-96" />

      {/* Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>

      {/* Activity Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
