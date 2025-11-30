import { DashboardShell } from "@/components/features/dashboard/dashboard-shell";
import { DashboardSkeleton } from "@/components/shared/loading-skeletons";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <DashboardSkeleton />
    </DashboardShell>
  );
}
