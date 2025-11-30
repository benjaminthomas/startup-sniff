import { DashboardShell } from "@/components/features/dashboard/dashboard-shell";
import { ListSkeleton, CardSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Conversations list */}
        <ListSkeleton items={8} />
      </div>
    </DashboardShell>
  );
}
