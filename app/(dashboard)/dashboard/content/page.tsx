import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, BarChart3, Library } from "lucide-react";
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { ContentGenerationForm } from '@/components/features/content/content-generation-form';
import { GeneratedContentShowcase } from '@/components/features/content/generated-content-showcase';
import { ContentAnalytics } from '@/components/features/content/content-analytics';
import { getUserIdeas } from '@/server/actions/ideas';
import { getUserContent } from '@/server/actions/content';

export default async function ContentPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Note: Content stats calculation removed - not currently displayed in UI
  // Can be re-added when analytics dashboard is implemented

  // Get user's startup ideas for content generation
  const userIdeas = user ? await getUserIdeas(10) : [];

  // Type cast for compatibility with StartupIdea interface
  const typedUserIdeas = userIdeas as any[];
  
  // Get user's generated content
  const userContent = user ? await getUserContent(20) : [];

  // Type cast for compatibility with GeneratedContent interface
  const typedUserContent = userContent as any[];
  
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
            <ContentGenerationForm userIdeas={typedUserIdeas} />
          </div>
        </TabsContent>

        {/* My Library Tab */}
        <TabsContent value="library" className="mt-8">
          <GeneratedContentShowcase content={typedUserContent} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-8">
          <ContentAnalytics content={typedUserContent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}