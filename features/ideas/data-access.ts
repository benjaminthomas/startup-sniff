/**
 * Data Access Layer for Startup Ideas
 *
 * This module provides server-side data fetching functions for startup ideas.
 * These functions are designed to be used in Next.js Server Components.
 */

import { notFound } from 'next/navigation';
import { getCurrentSession } from '@/features/auth/services/jwt';
import { createServerAdminClient } from '@/features/supabase';
import { mapDatabaseRowToStartupIdea, type StartupIdea } from '@/types/startup-ideas';

/**
 * Fetches a complete startup idea with all its details
 * @param id - The ID of the idea to fetch
 * @returns The complete startup idea object
 * @throws {notFound} If the idea doesn't exist or user is not authenticated
 */
export async function getIdeaWithDetails(id: string): Promise<StartupIdea> {
  // Verify authentication
  const session = await getCurrentSession();
  if (!session) {
    notFound();
  }

  // Create admin client for database access
  const supabase = createServerAdminClient();

  // Fetch the idea from database
  const { data: ideaRaw, error } = await supabase
    .from('startup_ideas')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.userId)
    .single();

  if (error || !ideaRaw) {
    notFound();
  }

  // Convert database row to typed object
  return mapDatabaseRowToStartupIdea(ideaRaw);
}

/**
 * Checks if an idea has been validated
 * @param idea - The startup idea object
 * @returns The validation status
 */
export function getValidationStatus(idea: StartupIdea): {
  isValidated: boolean;
  hasValidationData: boolean;
} {
  return {
    isValidated: !!idea.is_validated,
    hasValidationData: !!idea.validation_data,
  };
}
