'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageCircle,
  Mail,
  Globe,
  Copy,
  Target,
  Sparkles,
  Clock
} from "lucide-react";
import { getContentIcon, getContentTypeLabel, getContentTypeColor, getBrandVoiceIcon } from "@/lib/utils/content-helpers";

export interface GeneratedContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  brand_voice?: string | null;
  seo_keywords?: string[] | null;
  created_at: string;
  startup_idea_id?: string | null;
  updated_at?: string;
  user_id?: string;
}

interface ContentCardProps {
  content: GeneratedContent;
  onCopy: (text: string) => void;
  onView: () => void;
}

export function ContentCard({ content, onCopy, onView }: ContentCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-background to-background/50 hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary/30">
      {/* Header with enhanced styling */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2"
              onClick={onView}
            >
              {content.title}
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className={`${getContentTypeColor(content.content_type)} font-medium shadow-sm`}>
                {getContentIcon(content.content_type)}
                <span className="ml-1.5">{getContentTypeLabel(content.content_type)}</span>
              </Badge>

              {content.brand_voice && (
                <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
                  {getBrandVoiceIcon(content.brand_voice)}
                  <span className="ml-1 capitalize font-medium">
                    {content.brand_voice.replace('_', ' ')}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6" onClick={onView}>
        {/* Enhanced content preview */}
        <div className="relative">
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 border-l-4 border-primary/20 pl-4 bg-muted/30 p-3 rounded-r-lg">
            {content.content.slice(0, 280)}...
          </p>
        </div>

        {/* Interactive metrics with hover effects */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <FileText className="h-4 w-4" />
              <span className="font-semibold text-lg">{Math.ceil(content.content.length / 5)}</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">words</p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Target className="h-4 w-4" />
              <span className="font-semibold text-lg">{content.seo_keywords?.length || 0}</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">keywords</p>
          </div>
        </div>

        {/* SEO Keywords showcase */}
        {content.seo_keywords && content.seo_keywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {content.seo_keywords.slice(0, 3).map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-900/10 dark:text-emerald-300 dark:border-emerald-800/30 px-2 py-1"
                >
                  #{keyword}
                </Badge>
              ))}
              {content.seo_keywords.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs border-dashed bg-muted/50 hover:bg-muted px-2 py-1"
                >
                  +{content.seo_keywords.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Enhanced reading time and date */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {Math.ceil(content.content.length / 1000)} min read
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(content.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      </CardContent>

      {/* Floating action button */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(content.content);
          }}
          size="sm"
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Subtle hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </Card>
  );
}
