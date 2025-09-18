import { PageHeader } from "@/components/ui/page-header";
import { RedditTrends } from "@/components/features/trends/reddit-trends";

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pain Point Discovery"
        description="Find real user problems and emerging market opportunities from Reddit communities - perfect for your next startup idea"
      />

      <RedditTrends />
    </div>
  );
}