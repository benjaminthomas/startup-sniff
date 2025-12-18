'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  MessageCircle,
  Mail,
  Globe,
  Sparkles
} from "lucide-react";
import { toast } from 'sonner';
import { log } from '@/lib/logger/client';
import { ContentCard, GeneratedContent } from './ContentCard';
import { ContentPreviewDialog } from './ContentPreviewDialog';
import { useContentFiltering } from '@/hooks/useContentFiltering';
import { getContentIcon, getContentTypeLabel } from '@/lib/utils/content-helpers';

interface GeneratedContentShowcaseProps {
  content: GeneratedContent[];
}

export function GeneratedContentShowcase({ content }: GeneratedContentShowcaseProps) {
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { contentByType, contentCounts } = useContentFiltering(content);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Content copied to clipboard!');
    } catch {
      toast.error('Failed to copy content');
    }
  };

  const handleViewContent = (item: GeneratedContent) => {
    setSelectedContent(item);
    setViewDialogOpen(true);
  };

  // Debug logging
  log.info('Modal state:', {
    viewDialogOpen,
    selectedContent: selectedContent ? {
      id: selectedContent.id,
      title: selectedContent.title,
      contentLength: selectedContent.content?.length,
      hasContent: !!selectedContent.content
    } : null,
    totalContent: content.length
  });

  if (content.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No content generated yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Generate your first piece of marketing content using the form above.
            Connect it to your startup ideas for personalized results!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Content Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generated Content Library
          </CardTitle>
          <CardDescription>
            Your AI-generated marketing content organized by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/30 p-1 rounded-xl h-12">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                All ({contentCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="blog_post"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Blog Posts</span>
                <span className="sm:hidden">Blogs</span>
                {contentCounts.blog_post > 0 && `(${contentCounts.blog_post})`}
              </TabsTrigger>
              <TabsTrigger
                value="tweet"
                className="data-[state=active]:bg-sky-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Twitter</span>
                <span className="sm:hidden">X</span>
                {contentCounts.tweet > 0 && `(${contentCounts.tweet})`}
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Email</span>
                {contentCounts.email > 0 && `(${contentCounts.email})`}
              </TabsTrigger>
              <TabsTrigger
                value="landing_page"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Landing</span>
                <span className="sm:hidden">LP</span>
                {contentCounts.landing_page > 0 && `(${contentCounts.landing_page})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {content.slice(0, 9).map((item) => (
                  <ContentCard
                    key={item.id}
                    content={item}
                    onCopy={handleCopy}
                    onView={() => handleViewContent(item)}
                  />
                ))}
              </div>
              {content.length > 9 && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Showing 9 of {content.length} pieces. View individual tabs to see all content by type.
                  </p>
                </div>
              )}
            </TabsContent>

            {Object.entries(contentByType).map(([type, items]) => (
              <TabsContent key={type} value={type} className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getContentIcon(type)}
                    <h3 className="text-lg font-semibold">{getContentTypeLabel(type)}</h3>
                    <Badge variant="secondary">{items.length} pieces</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      onCopy={handleCopy}
                      onView={() => handleViewContent(item)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Content View Dialog */}
      <ContentPreviewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        content={selectedContent}
        onCopy={handleCopy}
      />
    </div>
  );
}
