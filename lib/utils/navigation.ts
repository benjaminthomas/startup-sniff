import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Robust navigation helper:
 * - For free plan: go to signup (nice UX)
 * - For paid plan: go to signin with next param pointing to checkout
 * - Try client-side push, but fallback to full page navigation on failure
 */
export const redirectToAuth = async (
  router: AppRouterInstance,
  planId: string,
  isFree = false
) => {
  try {
    if (isFree) {
      // Signup for free plan (better UX)
      const nextUrl = encodeURIComponent(`/dashboard?plan=${planId}`);
      // try client side
      await router.push(`/auth/signup?next=${nextUrl}`);
      return;
    }

    // Paid plans -> signin then checkout
    const nextUrl = encodeURIComponent(`/checkout?plan=${planId}`);
    await router.push(`/auth/signin?next=${nextUrl}`);
  } catch (err) {
    // router.push rejected (network or internal). Fall back to full navigation.
    // This avoids "Failed to fetch" bubbling up to the console as a TypeError.
    console.warn("router.push failed, falling back to full navigation:", err);
    if (isFree) {
      window.location.href = `/auth/signup?next=${encodeURIComponent(
        `/dashboard?plan=${planId}`
      )}`;
    } else {
      window.location.href = `/auth/signin?next=${encodeURIComponent(
        `/checkout?plan=${planId}`
      )}`;
    }
  }
};