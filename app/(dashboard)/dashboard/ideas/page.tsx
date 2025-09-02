import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { IdeaCard } from '@/components/features/dashboard/idea-card';
import { getUserIdeas } from '@/server/actions/ideas';
import { Plus, Lightbulb } from 'lucide-react';

export default async function IdeasPage() {
  const ideas = await getUserIdeas(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Ideas"
        description="Manage and track your generated startup ideas"
      >
        <div className="mt-4">
          <Button asChild>
            <Link href="/dashboard/generate">
              <Plus className="mr-2 h-4 w-4" />
              Generate New Idea
            </Link>
          </Button>
        </div>
      </PageHeader>

      {ideas.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl mb-2">No Ideas Yet</CardTitle>
              <CardDescription className="max-w-sm mx-auto">
                Get started by generating your first AI-powered startup idea. 
                It only takes a few minutes!
              </CardDescription>
            </div>
            <Button asChild className="mt-4">
              <Link href="/dashboard/generate">
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First Idea
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {ideas.length} {ideas.length === 1 ? 'Idea' : 'Ideas'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Sorted by most recent
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {ideas.filter(idea => idea.is_validated).length} Validated
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ideas.length - ideas.filter(idea => idea.is_validated).length} Pending
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Suspense 
                key={idea.id} 
                fallback={
                  <div className="animate-pulse bg-muted h-64 rounded-lg" />
                }
              >
                <IdeaCard idea={idea} />
              </Suspense>
            ))}
          </div>
        </>
      )}
    </div>
  );
}