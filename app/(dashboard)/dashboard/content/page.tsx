import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { FileText, PenTool, Share2, Copy } from "lucide-react";
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';

export default async function ContentPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let contentStats = {
    contentCreated: 0,
    blogPosts: 0,
    socialPosts: 0,
    templates: 12, // This could be a fixed number of available templates
  };

  if (user) {
    // Fetch actual content generation statistics
    const { data: generatedContent } = await supabase
      .from('generated_content')
      .select('content_type, created_at')
      .eq('user_id', user.id);

    if (generatedContent) {
      contentStats.contentCreated = generatedContent.length;
      contentStats.blogPosts = generatedContent.filter(content => content.content_type === 'blog_post').length;
      contentStats.socialPosts = generatedContent.filter(content => 
        content.content_type === 'tweet' || content.content_type === 'social_media'
      ).length;
    }
  }
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

      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
          <CardDescription>
            Create marketing content tailored to your startup and audience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog-post">Blog Post</SelectItem>
                  <SelectItem value="social-media">Social Media Post</SelectItem>
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="landing-page">Landing Page Copy</SelectItem>
                  <SelectItem value="press-release">Press Release</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone & Style</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="exciting">Exciting</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic/Subject</Label>
            <Input
              id="topic"
              placeholder="What do you want to write about?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-points">Key Points</Label>
            <Textarea
              id="key-points"
              placeholder="List the main points you want to cover..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience</Label>
            <Input
              id="target-audience"
              placeholder="Who is this content for?"
            />
          </div>

          <Button className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Generate Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}