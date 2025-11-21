import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * Server-side Supabase client with proper environment validation
 * This client should only be used in server-side code (API routes, server actions, etc.)
 */

// Environment validation
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const

// Validate required environment variables
function validateEnvironment() {
  const missing = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all Supabase environment variables are set.'
    )
  }
}

// Validate environment on module load
validateEnvironment()

/**
 * Regular Supabase client for server-side operations with RLS enabled
 * Use this for most server-side operations where RLS policies should be enforced
 */
export const supabaseServer = createClient<Database>(
  requiredEnvVars.SUPABASE_URL!,
  requiredEnvVars.SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'startup-sniff-server',
      },
    },
  }
)

/**
 * Admin Supabase client with service role key (bypasses RLS)
 * Use this only when you need to bypass RLS policies for administrative operations
 * ⚠️ CAUTION: This client bypasses all RLS policies. Use with extreme care.
 */
export const supabaseAdmin = createClient<Database>(
  requiredEnvVars.SUPABASE_URL!,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'startup-sniff-admin',
      },
    },
  }
)

/**
 * Helper function to create an authenticated Supabase client for a specific user
 * @param accessToken - The user's access token
 * @returns Supabase client with user context
 */
export function createAuthenticatedClient(accessToken: string) {
  const client = createClient<Database>(
    requiredEnvVars.SUPABASE_URL!,
    requiredEnvVars.SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-application-name': 'startup-sniff-auth',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )

  return client
}

/**
 * Helper function to get user from server-side request
 * @param request - The incoming request
 * @returns User object if authenticated, null otherwise
 */
export async function getServerUser(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    const client = createAuthenticatedClient(token)

    const { data: { user }, error } = await client.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

/**
 * Type-safe database operations helper
 * Provides common patterns for database operations with proper error handling
 */
export class DatabaseOperations {
  constructor(private client: typeof supabaseServer) {}

  /**
   * Safe database operation with error handling
   * @param operation - Database operation function
   * @returns Result with data or error
   */
  async safeOperation<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>
  ): Promise<{ data: T | null; error: string | null; success: boolean }> {
    try {
      const result = await operation()

      if (result.error) {
        console.error('Database operation error:', result.error)
        return {
          data: null,
          error: (result.error as Record<string, unknown>)?.message as string || 'Database operation failed',
          success: false
        }
      }

      return {
        data: result.data,
        error: null,
        success: true
      }
    } catch (error) {
      console.error('Unexpected database error:', error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unexpected error occurred',
        success: false
      }
    }
  }

  /**
   * Check if a table exists and user has access
   * @param tableName - Name of the table to check
   * @returns Boolean indicating if table is accessible
   */
  async checkTableAccess(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(tableName as keyof Database['public']['Tables'])
        .select('*')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }
}

// Export pre-configured database operations instances
export const dbOps = new DatabaseOperations(supabaseServer)
export const adminDbOps = new DatabaseOperations(supabaseAdmin)

/**
 * Environment info for debugging and monitoring
 */
export const supabaseConfig = {
  url: requiredEnvVars.SUPABASE_URL!,
  hasServiceKey: !!requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  hasAnonKey: !!requiredEnvVars.SUPABASE_ANON_KEY,
  environment: process.env.NODE_ENV,
} as const