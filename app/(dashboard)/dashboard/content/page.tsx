import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FileText, PenTool, Share2, Copy } from "lucide-react";
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { ContentGenerationForm } from '@/components/features/content/content-generation-form';
import { GeneratedContentShowcase } from '@/components/features/content/generated-content-showcase';
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.contentCreated}</div>
            <p className="text-xs text-muted-foreground">Total generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.blogPosts}</div>
            <p className="text-xs text-muted-foreground">Blog posts created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Posts</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.socialPosts}</div>
            <p className="text-xs text-muted-foreground">Social posts created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.templates}</div>
            <p className="text-xs text-muted-foreground">Available templates</p>
          </CardContent>
        </Card>
      </div>

      <ContentGenerationForm userIdeas={userIdeas} />

      <GeneratedContentShowcase content={userContent} />
    </div>
  );
}