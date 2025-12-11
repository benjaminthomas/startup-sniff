'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  MessageCircle,
  Mail,
  Globe,
  Copy,
  Calendar,
  Target,
  Sparkles,
  Clock
} from "lucide-react";
import { toast } from 'sonner';
import { log } from '@/lib/logger/client'

interface GeneratedContent {
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

interface GeneratedContentShowcaseProps {
  content: GeneratedContent[];
}

export function GeneratedContentShowcase({ content }: GeneratedContentShowcaseProps) {
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'blog_post': return <FileText className="h-4 w-4" />;
      case 'tweet': return <MessageCircle className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'landing_page': return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'blog_post': return 'Blog Post';
      case 'tweet': return 'Twitter Thread';
      case 'email': return 'Email Campaign';
      case 'landing_page': return 'Landing Page';
      default: return 'Content';
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'blog_post': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'tweet': return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
      case 'email': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'landing_page': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Content copied to clipboard!');
    } catch {
      toast.error('Failed to copy content');
    }
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

  const contentByType = content.reduce((acc, item) => {
    if (!acc[item.content_type]) {
      acc[item.content_type] = [];
    }
    acc[item.content_type].push(item);
    return acc;
  }, {} as Record<string, GeneratedContent[]>);

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
                All ({content.length})
              </TabsTrigger>
              <TabsTrigger
                value="blog_post"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Blog Posts</span>
                <span className="sm:hidden">Blogs</span>
                {contentByType.blog_post && `(${contentByType.blog_post.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="tweet"
                className="data-[state=active]:bg-sky-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Twitter</span>
                <span className="sm:hidden">X</span>
                {contentByType.tweet && `(${contentByType.tweet.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Email</span>
                {contentByType.email && `(${contentByType.email.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="landing_page"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Landing</span>
                <span className="sm:hidden">LP</span>
                {contentByType.landing_page && `(${contentByType.landing_page.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {content.slice(0, 9).map((item) => (
                  <ContentCard
                    key={item.id}
                    content={item}
                    onCopy={handleCopy}
                    onView={() => {
                      setSelectedContent(item)
                      setViewDialogOpen(true)
                    }}
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
                      onView={() => {
                        setSelectedContent(item)
                        setViewDialogOpen(true)
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Content View Dialog - Simplified & Working */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContent && getContentIcon(selectedContent.content_type)}
              {selectedContent?.title || 'Content Preview'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedContent ? (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getContentTypeColor(selectedContent.content_type)}>
                  {getContentTypeLabel(selectedContent.content_type)}
                </Badge>
                {selectedContent.brand_voice && (
                  <Badge variant="outline">
                    {selectedContent.brand_voice.replace('_', ' ')}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(selectedContent.created_at).toLocaleDateString()}
                </Badge>
              </div>

              {/* SEO Keywords */}
              {selectedContent.seo_keywords && selectedContent.seo_keywords.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Keywords:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedContent.seo_keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content with Copy Button */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Generated Content</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(selectedContent.content)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                {/* Scrollable Content Area */}
                <div 
                  className="bg-muted/20 border rounded-lg p-4 max-h-[300px] overflow-y-auto"
                  style={{ wordWrap: 'break-word' }}
                >
                  <div className="whitespace-pre-wrap text-sm leading-6">
                    {selectedContent.content || 'No content available'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center text-sm text-muted-foreground pt-3 border-t">
                <div className="flex gap-4">
                  <span>{Math.ceil(selectedContent.content?.length / 5) || 0} words</span>
                  <span>{selectedContent.content?.length || 0} characters</span>
                </div>
                <span>
                  Created {new Date(selectedContent.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No content selected
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ContentCardProps {
  content: GeneratedContent;
  onCopy: (text: string) => void;
  onView: () => void;
}

function ContentCard({ content, onCopy, onView }: ContentCardProps) {
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'blog_post': return <FileText className="h-4 w-4" />;
      case 'tweet': return <MessageCircle className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'landing_page': return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'blog_post': return 'Blog Post';
      case 'tweet': return 'Twitter Thread';
      case 'email': return 'Email Campaign';
      case 'landing_page': return 'Landing Page';
      default: return 'Content';
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'blog_post': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/10 dark:text-blue-300 dark:border-blue-800';
      case 'tweet': return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/10 dark:text-sky-300 dark:border-sky-800';
      case 'email': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/10 dark:text-green-300 dark:border-green-800';
      case 'landing_page': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/10 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-950/10 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getBrandVoiceIcon = (voice: string) => {
    switch (voice) {
      case 'technical': return <Target className="h-3 w-3" />;
      case 'growth_hacker': return <Target className="h-3 w-3" />;
      case 'storyteller': return <MessageCircle className="h-3 w-3" />;
      case 'educator': return <FileText className="h-3 w-3" />;
      case 'contrarian': return <Sparkles className="h-3 w-3" />;
      default: return <Sparkles className="h-3 w-3" />;
    }
  };

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