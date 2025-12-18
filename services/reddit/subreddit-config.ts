/**
 * Subreddit Configuration for StartupSniff
 *
 * This file defines the target subreddits for pain point discovery
 * based on Epic 1 technical specification.
 */

export interface SubredditConfig {
  name: string
  category: 'entrepreneurship' | 'saas' | 'development' | 'freelance' | 'niche'
  priority: 'high' | 'medium' | 'low'
  description: string
}

/**
 * Primary subreddits for pain point discovery
 *
 * Selection criteria:
 * - Active community (10k+ members)
 * - Business/startup focus
 * - High signal-to-noise ratio
 * - Frequent pain point discussions
 */
export const STARTUP_SUBREDDITS: SubredditConfig[] = [
  // High Priority - Entrepreneurship & Startups
  {
    name: 'entrepreneur',
    category: 'entrepreneurship',
    priority: 'high',
    description: 'General entrepreneurship discussions, 3M+ members'
  },
  {
    name: 'startups',
    category: 'entrepreneurship',
    priority: 'high',
    description: 'Startup-specific discussions, 1.5M+ members'
  },
  {
    name: 'smallbusiness',
    category: 'entrepreneurship',
    priority: 'high',
    description: 'Small business owners, 1M+ members'
  },
  {
    name: 'business',
    category: 'entrepreneurship',
    priority: 'medium',
    description: 'General business discussions'
  },

  // High Priority - SaaS & Software
  {
    name: 'SaaS',
    category: 'saas',
    priority: 'high',
    description: 'SaaS founders and operators, 200k+ members'
  },
  {
    name: 'microsaas',
    category: 'saas',
    priority: 'high',
    description: 'Micro-SaaS and indie SaaS builders'
  },
  {
    name: 'indiehackers',
    category: 'saas',
    priority: 'high',
    description: 'Independent product builders and makers'
  },

  // Medium Priority - Development & Technical
  {
    name: 'webdev',
    category: 'development',
    priority: 'medium',
    description: 'Web developers discussing technical challenges'
  },
  {
    name: 'programming',
    category: 'development',
    priority: 'medium',
    description: 'General programming community'
  },
  {
    name: 'learnprogramming',
    category: 'development',
    priority: 'medium',
    description: 'People learning to code (pain points around education)'
  },

  // Medium Priority - Freelance & Side Projects
  {
    name: 'freelance',
    category: 'freelance',
    priority: 'medium',
    description: 'Freelancers and consultants'
  },
  {
    name: 'sidehustle',
    category: 'freelance',
    priority: 'medium',
    description: 'Side project creators'
  },
  {
    name: 'digitalnomad',
    category: 'freelance',
    priority: 'medium',
    description: 'Remote workers and digital nomads'
  },

  // Low Priority - Niche Communities
  {
    name: 'marketing',
    category: 'niche',
    priority: 'low',
    description: 'Marketing professionals'
  },
  {
    name: 'ecommerce',
    category: 'niche',
    priority: 'low',
    description: 'E-commerce store owners'
  },
  {
    name: 'solopreneur',
    category: 'niche',
    priority: 'low',
    description: 'Solo founders and one-person businesses'
  },
  {
    name: 'buildinpublic',
    category: 'niche',
    priority: 'low',
    description: 'Builders sharing their journey publicly'
  }
]

/**
 * Get list of subreddit names only (for API calls)
 */
export function getSubredditNames(priority?: 'high' | 'medium' | 'low'): string[] {
  if (priority) {
    return STARTUP_SUBREDDITS
      .filter(sub => sub.priority === priority)
      .map(sub => sub.name)
  }
  return STARTUP_SUBREDDITS.map(sub => sub.name)
}

/**
 * Get subreddits by category
 */
export function getSubredditsByCategory(category: SubredditConfig['category']): SubredditConfig[] {
  return STARTUP_SUBREDDITS.filter(sub => sub.category === category)
}

/**
 * Get high priority subreddits (recommended for frequent scanning)
 */
export function getHighPrioritySubreddits(): string[] {
  return getSubredditNames('high')
}

/**
 * Get all subreddit names for comprehensive scanning
 */
export function getAllSubredditNames(): string[] {
  return STARTUP_SUBREDDITS.map(sub => sub.name)
}

/**
 * Configuration summary
 */
export const SUBREDDIT_CONFIG_SUMMARY = {
  total: STARTUP_SUBREDDITS.length,
  byPriority: {
    high: STARTUP_SUBREDDITS.filter(s => s.priority === 'high').length,
    medium: STARTUP_SUBREDDITS.filter(s => s.priority === 'medium').length,
    low: STARTUP_SUBREDDITS.filter(s => s.priority === 'low').length
  },
  byCategory: {
    entrepreneurship: STARTUP_SUBREDDITS.filter(s => s.category === 'entrepreneurship').length,
    saas: STARTUP_SUBREDDITS.filter(s => s.category === 'saas').length,
    development: STARTUP_SUBREDDITS.filter(s => s.category === 'development').length,
    freelance: STARTUP_SUBREDDITS.filter(s => s.category === 'freelance').length,
    niche: STARTUP_SUBREDDITS.filter(s => s.category === 'niche').length
  }
} as const
