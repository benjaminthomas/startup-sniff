/**
 * Template Variant Analytics Page
 * Story 2.10: Template A/B Testing and Optimization
 *
 * Dashboard showing A/B test results for message template variants
 */

import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/features/auth/services/jwt'
import { TemplateVariantDashboard } from '@/features/analytics/components/template-variant-dashboard'
import { getTemplateVariantPerformance } from '@/features/analytics/actions/template-variants'

export const metadata = {
  title: 'Template A/B Testing | StartupSniff',
  description: 'Performance analytics for message template variants',
}

export default async function TemplateVariantsPage() {
  // Use JWT session instead of Supabase auth
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch variant performance data
  const performanceResult = await getTemplateVariantPerformance()

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Template A/B Testing
        </h1>
        <p className="mt-2 text-gray-600">
          Compare performance of different message template styles to optimize your response rates
        </p>
      </div>

      {performanceResult.success && performanceResult.variants ? (
        <TemplateVariantDashboard variants={performanceResult.variants} />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            {performanceResult.error || 'Unable to load variant performance data'}
          </p>
        </div>
      )}
    </div>
  )
}
