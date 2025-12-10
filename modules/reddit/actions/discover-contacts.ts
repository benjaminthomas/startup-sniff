'use server'

import { createServerAdminClient } from '@/modules/supabase/server'
import type { RedditContact, RedditContactInsert } from '@/types/supabase'
import { log } from '@/lib/logger'

/**
 * Epic 2, Story 2.1: Human Discovery
 *
 * Discovers Reddit users who posted about a pain point and ranks them by engagement.
 * Returns top 5 contacts with their profiles and engagement scores.
 */

interface DiscoverContactsResult {
  success: boolean
  contacts: RedditContact[]
  totalFound: number
  totalPages: number
  currentPage: number
  error?: string
}

// Simple console logger for server actions
const logger = {
  info: (msg: string, context?: Record<string, unknown>) => log.info(`[discover-contacts] ${msg}`, context),
  warn: (msg: string, context?: Record<string, unknown>) => log.warn(`[discover-contacts] ${msg}`, context),
  error: (msg: string, error?: Error | unknown, context?: Record<string, unknown>) => log.error(`[discover-contacts] ${msg}`, error, context),
  debug: (msg: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      log.info(`[discover-contacts] ${msg}`, context)
    }
  }
}

/**
 * Get Reddit OAuth access token using refresh token
 */
async function getRedditAccessToken(): Promise<string | null> {
  try {
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString('base64')

    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'StartupSniff/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.REDDIT_REFRESH_TOKEN!
      })
    })

    if (!response.ok) {
      logger.error('Failed to get Reddit access token', undefined, { statusText: response.statusText })
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    logger.error('Error getting Reddit access token', error)
    return null
  }
}

/**
 * Fetch Reddit user profile
 */
async function fetchUserProfile(
  username: string,
  accessToken: string
): Promise<{
  name: string
  id: string
  created: number
  total_karma: number
} | null> {
  try {
    const response = await fetch(`https://oauth.reddit.com/user/${username}/about.json`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || 'StartupSniff/1.0'
      }
    })

    if (!response.ok) {
      logger.warn(`Failed to fetch profile for u/${username}`, { statusText: response.statusText })
      return null
    }

    const data = await response.json()

    if (data.data.is_suspended) {
      logger.warn(`User ${username} is suspended`)
      return null
    }

    return {
      name: data.data.name,
      id: data.data.id,
      created: data.data.created,
      total_karma: data.data.link_karma + data.data.comment_karma
    }
  } catch (error) {
    logger.error(`Error fetching profile for u/${username}`, error)
    return null
  }
}

/**
 * Calculate engagement score for a Reddit user
 * Formula: karma * 0.3 + posting_frequency * 0.5 + (1 / account_age_days) * 0.2
 * Capped at 999.99 to fit NUMERIC(5,2) database constraint
 */
function calculateEngagementScore(
  karma: number,
  postingFrequency: number,
  accountAgeDays: number
): number {
  const karmaScore = karma * 0.3
  const frequencyScore = postingFrequency * 0.5
  const recencyScore = (1 / Math.max(accountAgeDays, 1)) * 0.2

  const rawScore = karmaScore + frequencyScore + recencyScore
  // Cap at 999.99 to fit database NUMERIC(5,2) constraint
  const cappedScore = Math.min(rawScore, 999.99)

  return Number(cappedScore.toFixed(2))
}

/**
 * Estimate posting frequency (posts per week) based on account age and karma
 * This is a rough estimate since we can't easily count all posts via API
 */
function estimatePostingFrequency(karma: number, accountAgeDays: number): number {
  // Rough heuristic: assume karma/10 posts, distributed over account lifetime
  const estimatedPosts = karma / 10
  const weeks = accountAgeDays / 7

  return Number((estimatedPosts / Math.max(weeks, 1)).toFixed(2))
}

/**
 * Discover contacts for a pain point with pagination support
 */
export async function discoverContactsAction(
  painPointId: string,
  page: number = 1,
  limit: number = 5
): Promise<DiscoverContactsResult> {
  try {
    const supabase = createServerAdminClient()

    // 1. Get the pain point details
    const { data: painPoint, error: painPointError } = await supabase
      .from('reddit_posts')
      .select('*')
      .eq('id', painPointId)
      .single()

    if (painPointError || !painPoint) {
      logger.error('Pain point not found', painPointError, { painPointId })
      return {
        success: false,
        contacts: [],
        totalFound: 0,
        totalPages: 0,
        currentPage: page,
        error: 'Pain point not found'
      }
    }

    logger.info(`Discovering contacts for pain point: ${painPoint.title}`)

    // 2. Check if we already have cached contacts (discovered within last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get total count first
    const { count: totalCount } = await supabase
      .from('reddit_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('pain_point_id', painPointId)
      .gte('discovered_at', twentyFourHoursAgo)

    if (totalCount && totalCount > 0) {
      // Calculate pagination
      const offset = (page - 1) * limit
      const totalPages = Math.ceil(totalCount / limit)

      // Get paginated contacts
      const { data: cachedContacts, error: cacheError } = await supabase
        .from('reddit_contacts')
        .select('*')
        .eq('pain_point_id', painPointId)
        .gte('discovered_at', twentyFourHoursAgo)
        .order('engagement_score', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!cacheError && cachedContacts && cachedContacts.length > 0) {
        logger.info(`Returning ${cachedContacts.length} cached contacts (page ${page}/${totalPages})`)
        return {
          success: true,
          contacts: cachedContacts,
          totalFound: totalCount,
          totalPages,
          currentPage: page
        }
      }
    }

    // 3. Find similar posts from the same subreddit (last 48 hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: similarPosts, error: postsError } = await supabase
      .from('reddit_posts')
      .select('*')
      .eq('subreddit', painPoint.subreddit)
      .gte('created_utc', fortyEightHoursAgo)
      .neq('id', painPointId) // Exclude the original pain point
      .order('score', { ascending: false })
      .limit(20) // Get more than 5 to allow for filtering

    if (postsError) {
      logger.error('Failed to fetch similar posts', postsError)
      return {
        success: false,
        contacts: [],
        totalFound: 0,
        totalPages: 0,
        currentPage: page,
        error: 'Failed to fetch similar posts'
      }
    }

    if (!similarPosts || similarPosts.length === 0) {
      logger.warn('No similar posts found')
      return {
        success: true,
        contacts: [],
        totalFound: 0,
        totalPages: 0,
        currentPage: page
      }
    }

    logger.info(`Found ${similarPosts.length} similar posts`)

    // 4. Get Reddit access token
    const accessToken = await getRedditAccessToken()
    if (!accessToken) {
      logger.error('Failed to authenticate with Reddit')
      return {
        success: false,
        contacts: [],
        totalFound: 0,
        totalPages: 0,
        currentPage: page,
        error: 'Reddit authentication failed'
      }
    }

    // 5. Fetch user profiles and calculate engagement scores
    // Filter unique, valid users first
    const seenUsernames = new Set<string>()
    const validPosts = similarPosts.filter(post => {
      // Skip duplicates
      if (seenUsernames.has(post.author)) {
        return false
      }

      // Skip deleted or system users
      if (post.author === '[deleted]' || post.author === 'AutoModerator') {
        return false
      }

      seenUsernames.add(post.author)
      return true
    })

    logger.info(`Fetching profiles for ${validPosts.length} unique users`)

    // Fetch profiles in parallel with staggered delays (respect rate limits)
    const profilePromises = validPosts.map(async (post, index) => {
      // Stagger requests by 150ms to respect rate limits (instead of 1 second sequential)
      await new Promise(resolve => setTimeout(resolve, index * 150))

      const profile = await fetchUserProfile(post.author, accessToken)

      if (!profile) {
        logger.warn(`Failed to fetch profile for u/${post.author}`)
        return null
      }

      // Calculate account age in days
      const accountCreatedDate = new Date(profile.created * 1000)
      const accountAgeDays = Math.floor((Date.now() - accountCreatedDate.getTime()) / (1000 * 60 * 60 * 24))

      // Estimate posting frequency
      const postingFrequency = estimatePostingFrequency(profile.total_karma, accountAgeDays)

      // Calculate engagement score
      const engagementScore = calculateEngagementScore(
        profile.total_karma,
        postingFrequency,
        accountAgeDays
      )

      // Create post excerpt (first 200 chars)
      const postExcerpt = post.content
        ? post.content.substring(0, 200)
        : post.title.substring(0, 200)

      return {
        pain_point_id: painPointId,
        reddit_username: profile.name,
        reddit_user_id: profile.id,
        post_id: post.reddit_id,
        post_excerpt: postExcerpt || null,
        karma: profile.total_karma || 0,
        account_age_days: accountAgeDays || 0,
        posting_frequency: postingFrequency || 0,
        engagement_score: engagementScore || 0
      }
    })

    // Wait for all profiles to be fetched in parallel
    const results = await Promise.all(profilePromises)

    // Filter out null results (failed fetches)
    const contactsToInsert = results.filter((contact): contact is NonNullable<typeof results[number]> => contact !== null) as RedditContactInsert[]

    logger.info(`Successfully fetched ${contactsToInsert.length} contact profiles`)

    if (contactsToInsert.length === 0) {
      logger.warn('No valid contacts found after profile fetching')
      return {
        success: true,
        contacts: [],
        totalFound: 0,
        totalPages: 0,
        currentPage: page
      }
    }

    // 6. Sort by engagement score (store ALL contacts, not just top 5)
    const sortedContacts = contactsToInsert
      .sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0))

    logger.info(`Inserting ${sortedContacts.length} contacts into database`)

    // 7. Insert ALL contacts into database
    const { data: insertedContacts, error: insertError } = await supabase
      .from('reddit_contacts')
      .insert(sortedContacts)
      .select()

    if (insertError) {
      logger.error('Failed to cache contacts in database', insertError)
      // Return paginated contacts anyway (even if not cached)
      const totalPages = Math.ceil(sortedContacts.length / limit)
      const offset = (page - 1) * limit
      const paginatedContacts = sortedContacts.slice(offset, offset + limit)

      return {
        success: true,
        contacts: paginatedContacts as unknown as RedditContact[],
        totalFound: sortedContacts.length,
        totalPages,
        currentPage: page,
        error: `Contacts found but caching failed: ${insertError.message || 'Unknown error'}`
      }
    }

    logger.info(`Successfully discovered ${insertedContacts.length} contacts`)

    // 8. Return paginated results
    const totalPages = Math.ceil(insertedContacts.length / limit)
    const offset = (page - 1) * limit
    const paginatedContacts = insertedContacts.slice(offset, offset + limit)

    return {
      success: true,
      contacts: paginatedContacts,
      totalFound: insertedContacts.length,
      totalPages,
      currentPage: page
    }
  } catch (error) {
    logger.error('Unexpected error in discoverContactsAction', error)
    return {
      success: false,
      contacts: [],
      totalFound: 0,
      totalPages: 0,
      currentPage: page,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
