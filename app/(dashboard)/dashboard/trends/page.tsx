import { PageHeader } from "@/components/ui/page-header";
import { RedditTrends } from "@/components/features/trends/reddit-trends";

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reddit Trends Analysis"
        description="Discover trending topics and emerging opportunities from Reddit communities"
      />

      <RedditTrends />
    </div>
  );
}