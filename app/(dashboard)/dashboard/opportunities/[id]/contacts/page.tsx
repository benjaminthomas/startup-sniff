import { createServerAdminClient } from '@/modules/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ContactCard } from '@/components/features/contacts/contact-card'
import { ContactsPagination } from '@/components/features/contacts/contacts-pagination'
import { discoverContactsAction } from '@/modules/reddit/actions/discover-contacts'
import { getCurrentSession } from '@/modules/auth/services/jwt'
import { ConnectRedditButton } from '@/components/features/reddit/connect-reddit-button'
import { enforcePaidAccess } from '@/lib/paywall'

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerAdminClient()
  const { data: opportunity } = await supabase
    .from('reddit_posts')
    .select('title')
    .eq('reddit_id', id)
    .single()

  return {
    title: opportunity ? `Contacts for ${opportunity.title} | StartupSniff` : 'Contacts | StartupSniff',
    description: 'Discover Reddit users who posted about this pain point'
  }
}

export default async function ContactsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  // Check authentication
  const session = await getCurrentSession()
  if (!session) {
    redirect('/auth/signin')
  }

  // Enforce paid access - redirects to billing page if user is on free plan
  await enforcePaidAccess('contacts')

  const { id } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))
  const supabase = createServerAdminClient()

  // Get the pain point
  const { data: opportunity, error } = await supabase
    .from('reddit_posts')
    .select('*')
    .eq('reddit_id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  // Check if user has connected Reddit account
  const { data: userData } = await supabase
    .from('users')
    .select('reddit_username, reddit_connected_at')
    .eq('id', session.userId)
    .single()

  const hasRedditConnected = !!(userData?.reddit_username && userData?.reddit_connected_at)

  // Discover contacts with pagination (uses cache if available)
  const contactsResult = await discoverContactsAction(opportunity.id, currentPage, 5)

  return (
    <>
      {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Discovered Contacts
              </h1>
              <p className="text-gray-600 mb-4">
                Reddit users who posted about: <span className="font-medium">&quot;{opportunity.title}&quot;</span>
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                  r/{opportunity.subreddit}
                </span>
                <span>•</span>
                <span>Last 48 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reddit Connection Status */}
        {!hasRedditConnected && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Connect Your Reddit Account</h3>
                <p className="text-sm text-orange-800 mb-4">
                  To send messages to these contacts, you need to connect your Reddit account. Messages will be sent from <strong>your</strong> Reddit account, not from StartupSniff. This protects against spam bans and ensures authentic, personal communication.
                </p>
                <ul className="text-sm text-orange-700 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Messages sent from YOUR Reddit account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Secure OAuth authorization (no password sharing)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>You can disconnect anytime from settings</span>
                  </li>
                </ul>
                <ConnectRedditButton />
              </div>
            </div>
          </div>
        )}

        {hasRedditConnected && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  Connected as <span className="font-semibold">u/{userData?.reddit_username}</span>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  You can now send messages to contacts from your Reddit account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading/Error States */}
        {!contactsResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-3">⚠️</div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Failed to discover contacts</h3>
            <p className="text-red-700 mb-4">{contactsResult.error || 'Unknown error occurred'}</p>
            <Link
              href={`/dashboard/opportunities/${id}`}
              className="text-red-600 hover:text-red-700 font-medium underline"
            >
              Go back to opportunity
            </Link>
          </div>
        )}

        {/* No Contacts Found */}
        {contactsResult.success && contactsResult.contacts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts found yet</h3>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any Reddit users who recently posted about this pain point in r/{opportunity.subreddit}.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>💡 This might mean:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This is a unique pain point (first-mover advantage!)</li>
                <li>The subreddit is less active</li>
                <li>Try checking back in 24-48 hours</li>
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href={`/dashboard/opportunities/${id}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Go back to opportunity
              </Link>
            </div>
          </div>
        )}

        {/* Contacts Grid */}
        {contactsResult.success && contactsResult.contacts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold">{contactsResult.totalFound}</span> potential contacts
              </p>
              <div className="text-xs text-gray-500">
                Ranked by engagement score (karma, activity, recency)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactsResult.contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  hasRedditConnected={hasRedditConnected}
                />
              ))}
            </div>

            {/* Pagination */}
            <ContactsPagination
              currentPage={contactsResult.currentPage}
              totalPages={contactsResult.totalPages}
            />

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-2xl">ℹ️</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Review each contact&apos;s Reddit profile to understand their needs</li>
                    <li>• Look for specific pain points mentioned in their posts</li>
                    <li>• Consider reaching out via Reddit DM (requires Reddit OAuth - Coming in Story 2.2)</li>
                    <li>• Contacts are ranked by engagement score for best conversion potential</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
    </>
  )
}
