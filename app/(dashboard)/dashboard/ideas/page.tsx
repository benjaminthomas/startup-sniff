import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IdeasGrid } from '@/features/dashboard/components/ideas-grid';
import { getUserIdeas } from '@/features/ideas';
import { Plus, Lightbulb } from 'lucide-react';

export default async function IdeasPage() {
  const ideas = await getUserIdeas(50);

  return (
    <div className="space-y-6">
      {/* Page Header - New Design System Style */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">
            My Ideas
          </h1>
          <p className="text-sm text-neutral-600">
            Manage and track your generated startup ideas
          </p>
        </div>
        <Button asChild className="bg-[#2D6EF7] hover:bg-[#1E5EE8] text-white">
          <Link href="/dashboard/generate">
            <Plus className="mr-2 h-4 w-4" />
            Generate New Idea
          </Link>
        </Button>
      </div>

      {ideas.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#EBF2FE] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="h-8 w-8 text-[#2D6EF7]" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Ideas Yet</h2>
          <p className="text-sm text-neutral-600 max-w-sm mx-auto mb-6">
            Get started by generating your first AI-powered startup idea.
            It only takes a few minutes!
          </p>
          <Button asChild className="bg-[#2D6EF7] hover:bg-[#1E5EE8] text-white">
            <Link href="/dashboard/generate">
              <Plus className="mr-2 h-4 w-4" />
              Generate Your First Idea
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {ideas.length} {ideas.length === 1 ? 'Idea' : 'Ideas'}
              </h2>
              <p className="text-sm text-neutral-600">
                Sorted by most recent
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-[#D1FAE5] text-[#10B981] hover:bg-[#D1FAE5] text-xs border-0">
                {ideas.filter(idea => idea.is_validated).length} Validated
              </Badge>
              <Badge variant="outline" className="text-xs border-neutral-300 text-neutral-700">
                {ideas.length - ideas.filter(idea => idea.is_validated).length} Pending
              </Badge>
            </div>
          </div>

          <IdeasGrid ideas={ideas} />
        </>
      )}
    </div>
  );
}