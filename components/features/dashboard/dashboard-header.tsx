"use client";

interface DashboardHeaderProps {
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    plan_type?: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="border-b bg-background pb-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back
            {user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your startup ideas today.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Current Plan</div>
          <div className="text-lg font-semibold capitalize">
            {user?.plan_type || "Free"}
          </div>
        </div>
      </div>
    </div>
  );
}
