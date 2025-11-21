/**
 * Template Variant Dashboard Component
 * Story 2.10: Template A/B Testing and Optimization
 *
 * Displays A/B testing results for message template variants
 */

'use client'

import type { VariantPerformance } from '@/modules/analytics/actions/template-variants'
import { TEMPLATE_VARIANT_CONFIGS } from '@/lib/constants/template-variants'

interface Props {
  variants: VariantPerformance[]
}

export function TemplateVariantDashboard({ variants }: Props) {
  // Find the best performing variant
  const bestVariant = variants.reduce((best, current) =>
    current.responseRate > best.responseRate ? current : best
  )

  // Check if we have enough data for meaningful insights
  const totalSent = variants.reduce((sum, v) => sum + v.totalSent, 0)
  const hasEnoughData = totalSent >= 20

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Total Messages Sent</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalSent}</div>
          <div className="mt-1 text-xs text-gray-500">
            Across all variants
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Best Performing</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {bestVariant.variantLabel}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {bestVariant.responseRate.toFixed(1)}% response rate
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Statistical Confidence</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {variants.some(v => v.isStatisticallySignificant) ? (
              <>
                {variants.find(v => v.isStatisticallySignificant)?.confidenceLevel}%
              </>
            ) : (
              <span className="text-gray-400">Pending</span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {variants.some(v => v.isStatisticallySignificant)
              ? 'Results are statistically significant'
              : 'Need more data (min 50 per variant)'}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {!hasEnoughData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Early Stage Testing
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You&apos;re just getting started with A/B testing! Send at least 20 total messages
                  to see meaningful trends, and 50+ per variant for statistical significance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variant Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Variant Performance</h2>
          <p className="mt-1 text-sm text-gray-600">
            Detailed metrics for each template variant
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calls Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => {
                const config = TEMPLATE_VARIANT_CONFIGS[variant.variantName]
                const isWinner =
                  variant.isStatisticallySignificant &&
                  variant.variantName === bestVariant.variantName

                return (
                  <tr
                    key={variant.variantName}
                    className={isWinner ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {variant.variantLabel}
                          {isWinner && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Winner
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {config.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {variant.totalSent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {variant.totalResponded}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {variant.responseRate.toFixed(1)}%
                        </div>
                        {variant.responseRate > 0 && (
                          <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(variant.responseRate, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {variant.callsScheduled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {variant.customersAcquired}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {variant.isStatisticallySignificant ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Significant ({variant.confidenceLevel}%)
                        </span>
                      ) : variant.totalSent >= 50 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Testing
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Need {50 - variant.totalSent} more
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h2>

        <div className="space-y-4">
          {variants.some((v) => v.isStatisticallySignificant) ? (
            <>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Clear Winner Identified</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    The <strong>{bestVariant.variantLabel}</strong> variant is performing significantly
                    better with a {bestVariant.responseRate.toFixed(1)}% response rate. This variant
                    will be used as the default for future messages.
                  </p>
                </div>
              </div>
            </>
          ) : totalSent >= 20 ? (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Testing in Progress</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Keep sending messages to gather more data. We need at least 50 messages per variant
                  to determine statistical significance. Current best performer is{' '}
                  <strong>{bestVariant.variantLabel}</strong> at {bestVariant.responseRate.toFixed(1)}%.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Just Getting Started</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Start sending messages to see which template style works best for you. Each message
                  is randomly assigned a variant to ensure fair testing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
