import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { UserDatabase } from '@/modules/auth/services/database';
import type { User } from '@/types/database';
import type { SessionPayload } from '@/types/database';

/**
 * Verifies that the request is from an authenticated admin user
 * @returns User and session if authorized, NextResponse with error if not
 */
export async function verifyAdminAuth() {
  try {
    // Check for valid session
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await UserDatabase.findById(session.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    // Verify admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    return { user, session };
  } catch (error) {
    console.error('Admin auth verification failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Type guard to check if auth result is an error response
 */
export function isAuthError(
  result: { user: User; session: SessionPayload } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
