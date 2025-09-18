'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleFavorite } from '@/server/actions/ideas';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  ideaId: string;
  initialFavoriteState: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'ghost';
}

export function FavoriteButton({
  ideaId,
  initialFavoriteState,
  className,
  size = 'sm',
  variant = 'outline'
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavoriteState);
  const [isPending, startTransition] = useTransition();

  const handleToggleFavorite = () => {
    startTransition(async () => {
      try {
        const result = await toggleFavorite(ideaId);
        setIsFavorite(result.is_favorite);

        toast.success(
          result.is_favorite
            ? 'Added to favorites!'
            : 'Removed from favorites',
          {
            duration: 2000,
          }
        );
      } catch (error) {
        toast.error('Failed to update favorite status');
        console.error('Error toggling favorite:', error);
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isPending}
      className={className}
    >
      <Heart
        className={cn(
          "h-4 w-4 mr-2 transition-colors",
          isFavorite ? "text-red-500 fill-current" : ""
        )}
      />
      {isPending ? (
        isFavorite ? "Removing..." : "Adding..."
      ) : (
        isFavorite ? "Favorited" : "Add to Favorites"
      )}
    </Button>
  );
}