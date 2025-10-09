/**
 * Database utilities for custom authentication
 * Uses Supabase database but bypasses Supabase Auth
 */

import { createClient } from '@supabase/supabase-js'
import { User, UserInsert, UserUpdate, UserSession, UserSessionInsert, AuthRateLimit, AuthRateLimitInsert } from '@/types/database'

// Create Supabase client for database operations (not auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * User database operations
 */
export class UserDatabase {
  /**
   * Get user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      console.error('Database error finding user by email:', error)
      throw new Error('Failed to find user')
    }

    return data
  }

  /**
   * Get user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`User not found in database for ID: ${id}`)
        return null // No rows found
      }
      console.error('Database error finding user by ID:', error)
      throw new Error('Failed to find user')
    }

    return data
  }

  /**
   * Create a new user
   */
  static async create(userData: UserInsert): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        id: userData.id || crypto.randomUUID(),
        email: userData.email.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating user:', error)
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User with this email already exists')
      }
      throw new Error('Failed to create user')
    }

    return data
  }

  /**
   * Update user
   */
  static async update(id: string, updates: UserUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating user:', error)
      throw new Error('Failed to update user')
    }

    return data
  }

  /**
   * Update user login attempts
   */
  static async updateLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void> {
    const updates: UserUpdate = {
      login_attempts: attempts,
      locked_until: lockedUntil?.toISOString() || null,
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Database error updating login attempts:', error)
      throw new Error('Failed to update login attempts')
    }
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        login_attempts: 0, // Reset attempts on successful login
        locked_until: null,
      })
      .eq('id', id)

    if (error) {
      console.error('Database error updating last login:', error)
      throw new Error('Failed to update last login')
    }
  }
}

/**
 * Session database operations
 */
export class SessionDatabase {
  /**
   * Create a new session
   */
  static async create(sessionData: UserSessionInsert): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        ...sessionData,
        id: sessionData.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating session:', error)
      throw new Error('Failed to create session')
    }

    return data
  }

  /**
   * Find session by token
   */
  static async findByToken(token: string): Promise<UserSession | null> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      console.error('Database error finding session:', error)
      throw new Error('Failed to find session')
    }

    return data
  }

  /**
   * Delete session by token
   */
  static async deleteByToken(token: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', token)

    if (error) {
      console.error('Database error deleting session:', error)
      throw new Error('Failed to delete session')
    }
  }

  /**
   * Delete all sessions for a user
   */
  static async deleteAllForUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Database error deleting user sessions:', error)
      throw new Error('Failed to delete user sessions')
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpired(): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Database error cleaning up sessions:', error)
      throw new Error('Failed to cleanup expired sessions')
    }
  }
}

/**
 * Rate limiting database operations
 */
export class RateLimitDatabase {
  /**
   * Get rate limit record
   */
  static async get(identifier: string, endpoint: string): Promise<AuthRateLimit | null> {
    const { data, error } = await supabase
      .from('auth_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      console.error('Database error getting rate limit:', error)
      throw new Error('Failed to get rate limit')
    }

    return data
  }

  /**
   * Create or update rate limit record
   */
  static async upsert(rateLimitData: AuthRateLimitInsert): Promise<AuthRateLimit> {
    const { data, error } = await supabase
      .from('auth_rate_limits')
      .upsert({
        ...rateLimitData,
        id: rateLimitData.id || crypto.randomUUID(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'identifier,endpoint'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error upserting rate limit:', error)
      throw new Error('Failed to upsert rate limit')
    }

    return data
  }

  /**
   * Reset rate limit for identifier and endpoint
   */
  static async reset(identifier: string, endpoint: string): Promise<void> {
    const { error } = await supabase
      .from('auth_rate_limits')
      .delete()
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Database error resetting rate limit:', error)
      throw new Error('Failed to reset rate limit')
    }
  }

  /**
   * Clean up old rate limit records
   */
  static async cleanup(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('auth_rate_limits')
      .delete()
      .lt('created_at', oneDayAgo)

    if (error) {
      console.error('Database error cleaning up rate limits:', error)
      throw new Error('Failed to cleanup rate limits')
    }
  }
}

/**
 * General database utilities
 */
export class DatabaseUtils {
  /**
   * Run the cleanup function for expired auth data
   */
  static async runCleanup(): Promise<void> {
    const { error } = await supabase.rpc('cleanup_expired_auth_data')

    if (error) {
      console.error('Database error running cleanup:', error)
      throw new Error('Failed to run cleanup')
    }
  }

  /**
   * Health check for database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').select('id').limit(1)
      return !error
    } catch {
      return false
    }
  }
}