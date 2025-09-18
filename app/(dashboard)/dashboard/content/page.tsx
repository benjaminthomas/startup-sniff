import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, PenTool, Share2, Copy, Sparkles, BarChart3, Library } from "lucide-react";
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { ContentGenerationForm } from '@/components/features/content/content-generation-form';
import { GeneratedContentShowcase } from '@/components/features/content/generated-content-showcase';
import { ContentAnalytics } from '@/components/features/content/content-analytics';
import { getUserIdeas } from '@/server/actions/ideas';
import { getUserContent } from '@/server/actions/content';
import { CONTENT_TEMPLATES } from '@/constants';

export default async function ContentPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let contentStats = {
    contentCreated: 0,
    blogPosts: 0,
    socialPosts: 0,
    templates: CONTENT_TEMPLATES.length, // Actual number of available templates
  };

  if (user) {
    // Fetch actual content generation statistics
    const { data: generatedContent } = await supabase
      .from('generated_content')
      .select('content_type, created_at')
      .eq('user_id', user.id);

    if (generatedContent) {
      contentStats = {
        ...contentStats,
        contentCreated: generatedContent.length,
        blogPosts: generatedContent.filter(content => content.content_type === 'blog_post').length,
        socialPosts: generatedContent.filter(content => 
          content.content_type === 'tweet' || content.content_type === 'social_media'
        ).length,
      };
    }
  }

  // Get user's startup ideas for content generation
  const userIdeas = user ? await getUserIdeas(10) : [];
  
  // Get user's generated content
  const userContent = user ? await getUserContent(20) : [];
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Generation"
        description="Create compelling marketing content for your startup with AI assistance"
      />

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl h-12">
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Create Content
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          >
            <Library className="h-4 w-4" />
            My Library ({userContent.length})
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Create Content Tab */}
        <TabsContent value="create" className="mt-8">
          <div className="space-y-6">
            <ContentGenerationForm userIdeas={userIdeas} />
          </div>
        </TabsContent>

        {/* My Library Tab */}
        <TabsContent value="library" className="mt-8">
          <GeneratedContentShowcase content={userContent} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-8">
          <ContentAnalytics content={userContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}