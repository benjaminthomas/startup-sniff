/**
 * Security Event Logging System
 * 
 * Logs all authentication-related security events for monitoring and analysis
 */

import { createServerSupabaseClient } from '@/modules/supabase'

export interface SecurityEvent {
  event_type: 'login_success' | 'login_failure' | 'signup' | 'password_reset_request' | 
             'password_reset_success' | 'logout' | 'session_expired' | 'suspicious_activity' |
             'csrf_violation' | 'rate_limit_exceeded' | 'account_lockout'
  user_id?: string
  email?: string
  ip_address: string
  user_agent: string
  metadata?: Record<string, unknown>
  risk_score?: number
}

// Log security events to database
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const _supabase = await createServerSupabaseClient()

    // Security events table doesn't exist, skip database logging
    if (false) {
      // Placeholder for when security_events table is implemented
      await _supabase.from('users').select('id').limit(1)
    }

    // Security events table not implemented - log to console
    console.log('Security Event (console only):', JSON.stringify(event, null, 2))
  } catch (error) {
    console.error('Security logging error:', error)
    // Always log to console as fallback
    console.warn('Security Event (fallback):', JSON.stringify(event, null, 2))
  }
}

// Detect suspicious activity patterns
export const detectSuspiciousActivity = async (
  ip_address: string, 
  email?: string
): Promise<boolean> => {
  try {

    // Security events table not implemented - return no failed attempts
    const failedAttempts: never[] = []
    const error = null

    if (error) {
      console.error('Error checking suspicious activity:', error)
      return false
    }

    // Flag as suspicious if more than 5 failed attempts
    const isSuspicious = (failedAttempts?.length || 0) > 5

    if (isSuspicious) {
      await logSecurityEvent({
        event_type: 'suspicious_activity',
        email,
        ip_address,
        user_agent: '',
        metadata: {
          failed_attempts: failedAttempts?.length,
          timeframe: '15_minutes'
        },
        risk_score: 8
      })
    }

    return isSuspicious
  } catch (error) {
    console.error('Suspicious activity detection error:', error)
    return false
  }
}

// Log successful authentication
export const logAuthSuccess = async (
  user_id: string,
  email: string,
  ip_address: string,
  user_agent: string
) => {
  await logSecurityEvent({
    event_type: 'login_success',
    user_id,
    email,
    ip_address,
    user_agent,
    risk_score: 1
  })
}

// Log failed authentication
export const logAuthFailure = async (
  email: string,
  ip_address: string,
  user_agent: string,
  reason?: string
) => {
  await logSecurityEvent({
    event_type: 'login_failure',
    email,
    ip_address,
    user_agent,
    metadata: { failure_reason: reason },
    risk_score: 5
  })
}

// Log password reset events
export const logPasswordReset = async (
  event_type: 'password_reset_request' | 'password_reset_success',
  email: string,
  ip_address: string,
  user_agent: string,
  user_id?: string
) => {
  await logSecurityEvent({
    event_type,
    user_id,
    email,
    ip_address,
    user_agent,
    risk_score: event_type === 'password_reset_request' ? 3 : 2
  })
}

// Log logout events
export const logLogout = async (
  user_id: string,
  email: string,
  ip_address: string,
  user_agent: string
) => {
  await logSecurityEvent({
    event_type: 'logout',
    user_id,
    email,
    ip_address,
    user_agent,
    risk_score: 1
  })
}

// Get user's IP address from request
export const getClientIPAddress = (request: Request): string => {
  // Check various headers for real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || cfIp || 'unknown'
}

// Get user agent
export const getUserAgent = (request: Request): string => {
  return request.headers.get('user-agent') || 'unknown'
}
