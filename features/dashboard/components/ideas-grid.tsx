/**
 * Ideas Grid Component (Client Wrapper)
 *
 * Wraps IdeaCard components with action handlers
 * Uses dependency injection pattern to keep IdeaCard standalone
 */

'use client'

import { Suspense } from 'react'
import { IdeaCard } from './idea-card'
import { validateExistingIdea } from '@/features/validation'
import { toggleFavorite } from '@/features/ideas'
import type { IdeaCardData } from '@/types/components'

interface IdeasGridProps {
  ideas: IdeaCardData[]
}

export function IdeasGrid({ ideas }: IdeasGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ideas.map((idea) => (
        <Suspense
          key={idea.id}
          fallback={
            <div className="animate-pulse bg-muted h-64 rounded-lg" />
          }
        >
          <IdeaCard
            idea={idea}
            onValidate={validateExistingIdea}
            onToggleFavorite={toggleFavorite}
          />
        </Suspense>
      ))}
    </div>
  )
}
