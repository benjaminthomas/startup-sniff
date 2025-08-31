import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { IdeaGenerationForm } from '@/components/features/dashboard/idea-generation-form';
import { RecentIdeas } from '@/components/features/dashboard/recent-ideas';
import { getUserIdeas } from '@/server/actions/ideas';
import { Sparkles } from 'lucide-react';

export default async function GeneratePage() {
  let recentIdeas = [];
  
  try {
    recentIdeas = await getUserIdeas(3);
  } catch (error) {
    console.log('Failed to fetch recent ideas:', error);
    // Continue with empty array - component will handle this gracefully
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Ideas"
        description="Use AI to discover your next startup opportunity"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <IdeaGenerationForm />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Better Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">Be Specific</h4>
                <p className="text-sm text-muted-foreground">
                  The more details you provide, the more tailored your ideas will be
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Consider Your Skills</h4>
                <p className="text-sm text-muted-foreground">
                  Think about industries where you have experience or interest
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Stay Open-Minded</h4>
                <p className="text-sm text-muted-foreground">
                  Great opportunities often come from unexpected combinations
                </p>
              </div>
            </CardContent>
          </Card>

          <RecentIdeas ideas={recentIdeas} />
        </div>
      </div>
    </div>
  );
}