/**
 * Server Action CSRF Protection
 * 
 * Handles CSRF token verification specifically for Next.js Server Actions
 * where cookie context may differ from middleware
 */

import { cookies } from 'next/headers'
import { log } from '@/lib/logger'

const CSRF_TOKEN_NAME = 'csrf-token'
const TOKEN_LIFETIME = 24 * 60 * 60 * 1000 // 24 hours

export interface ServerActionCSRFResult {
  valid: boolean
  error?: string
}

/**
 * Server Action compatible CSRF verification
 * This function uses the Server Action cookie context
 */
export const verifyServerActionCSRF = async (formData: FormData): Promise<ServerActionCSRFResult> => {
  try {
    // Get CSRF token from form data
    const formToken = formData.get('csrf-token') as string
    const cookieStore = await cookies()
    const csrfCookie = cookieStore.get(CSRF_TOKEN_NAME)
    
    const cookieValue = csrfCookie?.value
    
    if (!formToken) {
      return {
        valid: false,
        error: 'No CSRF token in form data'
      }
    }
    
    if (!cookieValue) {
      return {
        valid: false,
        error: 'No CSRF token in cookies'
      }
    }
    
    // Parse tokens
    const [formTokenValue, formTimestamp] = formToken.split('.')
    const [cookieTokenValue, cookieTimestamp] = cookieValue.split('.')
    
    if (!formTokenValue || !formTimestamp || !cookieTokenValue || !cookieTimestamp) {
      return {
        valid: false,
        error: 'Invalid token format'
      }
    }
    
    // Check token ages
    const formAge = Date.now() - parseInt(formTimestamp, 10)
    const cookieAge = Date.now() - parseInt(cookieTimestamp, 10)
    
    if (formAge > TOKEN_LIFETIME || cookieAge > TOKEN_LIFETIME) {
      return {
        valid: false,
        error: 'Token expired'
      }
    }
    
    // Compare token values using timing-safe comparison
    if (formTokenValue.length !== cookieTokenValue.length) {
      return {
        valid: false,
        error: 'Token length mismatch'
      }
    }
    
    // Timing-safe comparison
    const encoder = new TextEncoder()
    const formBytes = encoder.encode(formTokenValue)
    const cookieBytes = encoder.encode(cookieTokenValue)
    
    let result = 0
    for (let i = 0; i < formBytes.length; i++) {
      result |= formBytes[i] ^ cookieBytes[i]
    }
    
    const isValid = result === 0
    
    return {
      valid: isValid,
      error: isValid ? undefined : 'Token values do not match'
    }
    
  } catch (error) {
    log.error('Server Action CSRF verification error:', error)
    return {
      valid: false,
      error: 'CSRF verification failed due to system error'
    }
  }
}

/**
 * Extract form data safely for Server Actions
 */
export const extractFormDataSafely = (formData: FormData) => {
  const data: Record<string, string> = {}
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      data[key] = value
    }
  }
  
  return data
}