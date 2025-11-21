import { Suspense } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { ValidationDashboard } from '@/components/features/analytics/validation-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Epic 1 Validation Dashboard
 * Epic 1, Story 1.12: Epic 1 Validation Dashboard
 *
 * Real-time validation metrics with GREEN/YELLOW/RED zone indicators
 */

export const metadata = {
  title: 'Epic 1 Validation Dashboard | StartupSniff',
  description: 'Real-time validation metrics and success indicators for Epic 1',
}

export default function Epic1ValidationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Epic 1 Validation"
        description="Real-time success metrics with GREEN/YELLOW/RED zone indicators"
      />

      <Suspense fallback={<ValidationDashboardSkeleton />}>
        <ValidationDashboard />
      </Suspense>
    </div>
  )
}

function ValidationDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
