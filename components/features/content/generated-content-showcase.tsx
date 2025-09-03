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
  Download, 
  Share2,
  Eye,
  Calendar,
  Target,
  Sparkles,
  BarChart3,
  X,
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from 'sonner';

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
    } catch (err) {
      toast.error('Failed to copy content');
    }
  };

  // Debug logging
  console.log('Modal state:', { 
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
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(contentByType).map(([type, items]) => (
          <Card key={type} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {getContentIcon(type)}
                <span className="text-sm font-medium">{getContentTypeLabel(type)}</span>
              </div>
              <div className="text-2xl font-bold text-primary">{items.length}</div>
              <div className="text-xs text-muted-foreground">pieces created</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generated Content Library
          </CardTitle>
          <CardDescription>
            Your AI-generated marketing content organized by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({content.length})</TabsTrigger>
              <TabsTrigger value="blog_post">Blog Posts</TabsTrigger>
              <TabsTrigger value="tweet">Twitter</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="landing_page">Landing Pages</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4">
                {content.slice(0, 6).map((item) => (
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

            {Object.entries(contentByType).map(([type, items]) => (
              <TabsContent key={type} value={type} className="mt-6">
                <div className="grid gap-4">
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
      case 'growth_hacker': return <TrendingUp className="h-3 w-3" />;
      case 'storyteller': return <MessageCircle className="h-3 w-3" />;
      case 'educator': return <FileText className="h-3 w-3" />;
      case 'contrarian': return <Sparkles className="h-3 w-3" />;
      default: return <Sparkles className="h-3 w-3" />;
    }
  };

  return (
    <Card 
      className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer border-2 hover:border-primary/20"
      onClick={onView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight pr-2 line-clamp-1">{content.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getContentTypeColor(content.content_type)}>
              {getContentIcon(content.content_type)}
              <span className="ml-1">{getContentTypeLabel(content.content_type)}</span>
            </Badge>
          </div>
        </div>
        {content.brand_voice && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs py-1">
              {getBrandVoiceIcon(content.brand_voice)}
              <span className="ml-1 capitalize">{content.brand_voice.replace('_', ' ')}</span>
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 flex flex-col h-full">
        <p className="text-muted-foreground text-sm line-clamp-3 flex-grow">
          {content.content.slice(0, 200)}...
        </p>

        {/* Key Metrics - Left aligned with SEO keywords on right */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-950/20 p-3 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{Math.ceil(content.content.length / 5)} words</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{Math.ceil(content.content.length / 1000)} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{content.seo_keywords?.length || 0} keywords</span>
            </div>
          </div>

          {/* SEO Keywords on the right for larger screens */}
          {content.seo_keywords && content.seo_keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.seo_keywords.slice(0, 2).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  #{keyword}
                </Badge>
              ))}
              {content.seo_keywords.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  +{content.seo_keywords.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Quick Copy Action */}
        <div className="mt-auto pt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(content.content);
            }}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            <Copy className="mr-2 h-4 w-4" />
            Quick Copy
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Created {new Date(content.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </CardContent>
    </Card>
  );
}