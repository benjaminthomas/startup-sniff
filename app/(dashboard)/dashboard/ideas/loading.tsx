import { DashboardShell } from "@/components/features/dashboard/dashboard-shell";
import { IdeaCardSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function IdeasLoading() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Ideas grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <IdeaCardSkeleton />
          <IdeaCardSkeleton />
          <IdeaCardSkeleton />
          <IdeaCardSkeleton />
          <IdeaCardSkeleton />
          <IdeaCardSkeleton />
        </div>
      </div>
    </DashboardShell>
  );
}
