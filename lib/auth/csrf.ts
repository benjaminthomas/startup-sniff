/**
 * CSRF Protection Implementation
 * 
 * Implements double-submit cookie pattern for CSRF protection
 */

// Using Web Crypto API for Edge Runtime compatibility
import { cookies } from 'next/headers'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LIFETIME = 24 * 60 * 60 * 1000 // 24 hours

export interface CSRFToken {
  value: string
  timestamp: number
}

// Generate a cryptographically secure CSRF token using Web Crypto API
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  const timestamp = Date.now()
  return `${token}.${timestamp}`
}

// Set CSRF token in HttpOnly cookie
export const setCSRFToken = async (token: string) => {
  const cookieStore = await cookies()
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_LIFETIME / 1000, // Convert to seconds
  })
}

// Get CSRF token from cookie
export const getCSRFToken = async (): Promise<string | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(CSRF_TOKEN_NAME)
  return token?.value || null
}

// Verify CSRF token using timing-safe comparison
export const verifyCSRFToken = async (providedToken: string): Promise<boolean> => {
  if (!providedToken) return false

  const storedToken = await getCSRFToken()
  if (!storedToken) return false

  try {
    // Parse stored token
    const [storedValue, storedTimestamp] = storedToken.split('.')
    const timestamp = parseInt(storedTimestamp, 10)

    // Check token age
    if (Date.now() - timestamp > TOKEN_LIFETIME) {
      return false
    }

    // Parse provided token
    const [providedValue, providedTimestamp] = providedToken.split('.')

    // Timing-safe comparison to prevent timing attacks using Web Crypto API
    if (storedValue.length !== providedValue.length) {
      return false
    }

    // Use Web Crypto API for timing-safe comparison
    const encoder = new TextEncoder()
    const storedBytes = encoder.encode(storedValue)
    const providedBytes = encoder.encode(providedValue)
    
    let result = 0
    for (let i = 0; i < storedBytes.length; i++) {
      result |= storedBytes[i] ^ providedBytes[i]
    }

    return result === 0 && storedTimestamp === providedTimestamp
  } catch (error) {
    console.error('CSRF token verification error:', error)
    return false
  }
}

// Generate token for forms (to be included in hidden form fields)
// This should only be called from Server Actions, not Server Components
export const generateFormCSRFToken = async (): Promise<string> => {
  const token = generateCSRFToken()
  await setCSRFToken(token)
  return token
}

// Get existing CSRF token or generate a new one (safe for Server Components)
export const getOrGenerateCSRFToken = async (): Promise<string> => {
  const existingToken = await getCSRFToken()
  if (existingToken) {
    // Check if token is still valid (not expired)
    try {
      const [, storedTimestamp] = existingToken.split('.')
      const timestamp = parseInt(storedTimestamp, 10)
      if (Date.now() - timestamp <= TOKEN_LIFETIME) {
        return existingToken
      }
    } catch {
      // Invalid token format, continue to generate new one
    }
  }
  
  // Return a generated token - the middleware will handle setting cookies
  return generateCSRFToken()
}

// Middleware helper to extract and verify CSRF token from request
export const extractAndVerifyCSRFToken = async (request: Request): Promise<boolean> => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  const method = request.method.toLowerCase()
  if (['get', 'head', 'options'].includes(method)) {
    return true
  }

  // Check header first
  let token = request.headers.get(CSRF_HEADER_NAME)
  
  // If not in header, check form data for POST requests
  if (!token && method === 'post') {
    try {
      const formData = await request.clone().formData()
      token = formData.get('csrf-token') as string
    } catch {
      // Not form data, continue without token
    }
  }

  if (!token) {
    return false
  }

  return await verifyCSRFToken(token)
}

// Clear CSRF token (for logout)
export const clearCSRFToken = async () => {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_TOKEN_NAME)
}