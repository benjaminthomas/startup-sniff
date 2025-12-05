/**
 * Subscription Status Utilities
 * Helpers for checking subscription state and access levels
 */

interface Subscription {
  status: 'trial' | 'active' | 'inactive' | 'cancelled' | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
}

/**
 * Check if a subscription has expired (past the current period end)
 */
export function isSubscriptionExpired(subscription: Subscription): boolean {
  if (!subscription.current_period_end) {
    return false;
  }

  const periodEnd = new Date(subscription.current_period_end);
  const now = new Date();

  return now > periodEnd;
}

/**
 * Check if a subscription is active (not expired)
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  // Must have active status
  if (subscription.status !== 'active') {
    return false;
  }

  // Must not be expired
  return !isSubscriptionExpired(subscription);
}

/**
 * Check if user has full access to features
 * Active subscriptions that haven't expired get full access
 */
export function hasFullAccess(subscription: Subscription | null): boolean {
  if (!subscription) {
    return false;
  }

  return isSubscriptionActive(subscription);
}

/**
 * Check if subscription is cancelled and expired (read-only access)
 * User can see content but not interact/create new items
 */
export function hasReadOnlyAccess(subscription: Subscription | null): boolean {
  if (!subscription) {
    return false;
  }

  // If subscription is cancelled or has cancel_at_period_end flag
  const isCancelled =
    subscription.status === 'cancelled' ||
    subscription.cancel_at_period_end === true;

  // And the period has ended
  const hasExpired = isSubscriptionExpired(subscription);

  return isCancelled && hasExpired;
}

/**
 * Get user's access level based on subscription state
 */
export function getUserAccessLevel(subscription: Subscription | null): 'full' | 'readonly' | 'none' {
  if (hasFullAccess(subscription)) {
    return 'full';
  }

  if (hasReadOnlyAccess(subscription)) {
    return 'readonly';
  }

  return 'none';
}

/**
 * Check if subscription should be marked as expired (for background jobs)
 */
export function shouldMarkAsExpired(subscription: Subscription): boolean {
  // Must be active with cancel_at_period_end flag
  if (subscription.status !== 'active' || !subscription.cancel_at_period_end) {
    return false;
  }

  // And must be past the period end date
  return isSubscriptionExpired(subscription);
}
