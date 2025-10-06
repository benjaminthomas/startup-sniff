/**
 * JWT Session Management
 * Uses jose library for Edge Runtime compatibility
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionPayload } from '@/types/database'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-secret-key-min-32-chars'
)

const JWT_ISSUER = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const JWT_AUDIENCE = 'startup-sniff-users'

// Session cookie configuration
const SESSION_COOKIE_NAME = 'session-token'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * Create a new JWT session token
 */
export async function createSessionToken(payload: {
  userId: string
  email: string
  sessionId: string
}): Promise<string> {
  try {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + SESSION_DURATION

    const token = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .sign(JWT_SECRET)

    return token
  } catch (error) {
    console.error('JWT creation error:', error)
    throw new Error('Failed to create session token')
  }
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      sessionId: payload.sessionId as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    }
  } catch (error) {
    // Don't log every invalid token attempt to avoid spam
    if (error instanceof Error && !error.message.includes('expired')) {
      console.error('JWT verification error:', error.message)
    }
    return null
  }
}

/**
 * Set session cookie with secure configuration
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

/**
 * Get session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  return sessionCookie?.value || null
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Get current session payload from cookie
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = await getSessionToken()
  if (!token) return null

  return await verifySessionToken(token)
}

/**
 * Refresh session token (extend expiry)
 */
export async function refreshSessionToken(currentToken: string): Promise<string | null> {
  const payload = await verifySessionToken(currentToken)
  if (!payload) return null

  // Create new token with same payload but extended expiry
  return await createSessionToken({
    userId: payload.userId,
    email: payload.email,
    sessionId: payload.sessionId,
  })
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate JWT secret configuration
 */
export function validateJWTConfig(): void {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
}

/**
 * Extract session info for logging (without sensitive data)
 */
export function getSessionInfo(payload: SessionPayload): {
  userId: string
  email: string
  issuedAt: Date
  expiresAt: Date
} {
  return {
    userId: payload.userId,
    email: payload.email,
    issuedAt: new Date(payload.iat * 1000),
    expiresAt: new Date(payload.exp * 1000),
  }
}