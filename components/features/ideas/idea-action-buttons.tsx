'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValidationButton } from '../validation/validation-button';
import { toggleFavorite } from '@/modules/ideas';
import {
  Heart,
  FileText,
  Download,
  Copy,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { StartupIdea } from '@/types/global';

interface IdeaActionButtonsProps {
  idea: StartupIdea;
}

export function IdeaActionButtons({ idea }: IdeaActionButtonsProps) {
  const [isFavorite, setIsFavorite] = useState(idea.is_favorite || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleToggleFavorite = async () => {
    setIsTogglingFavorite(true);
    try {
      const result = await toggleFavorite(idea.id);
      setIsFavorite(result.is_favorite);
      toast.success(result.is_favorite ? 'Added to favorites!' : 'Removed from favorites');
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast.error('Failed to update favorite status');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Idea link copied to clipboard!');
  };

  const handleExportPDF = () => {
    toast.info('PDF export feature coming soon!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Validation Button */}
        <ValidationButton
          ideaId={idea.id}
          isValidated={idea.is_validated || false}
          className="w-full"
        />

        {/* Favorite Button */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
        >
          <Heart className={`h-4 w-4 mr-2 transition-colors ${
            isFavorite ? 'text-red-500 fill-red-500' : ''
          }`} />
          {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>

        {/* Export PDF */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleExportPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </Button>

        {/* Copy Link */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleCopyLink}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </Button>

        {/* Generate Content */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => toast.info('Content generation coming soon!')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Content
        </Button>

        {/* View Similar Ideas */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => toast.info('Similar ideas feature coming soon!')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Find Similar Ideas
        </Button>
      </CardContent>
    </Card>
  );
}