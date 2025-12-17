import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { DynamicHeader } from "@/features/dashboard/components/dynamic-header";
import { TrialBanner } from "@/components/ui/trial-banner";
import { SessionTracker } from "@/components/analytics/session-tracker";
import { getCurrentSession } from "@/features/auth/services/jwt";
import { UserDatabase } from "@/features/auth/services/database";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use JWT session instead of Supabase auth
  const session = await getCurrentSession();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get user data from our JWT-based auth system
  let dbUser = null;
  try {
    dbUser = await UserDatabase.findById(session.userId);
  } catch {
    // Continue with session data as fallback
  }

  const displayUser = dbUser
    ? {
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name || null,
        plan_type: dbUser.plan_type || "free",
      }
    : {
        id: session.userId,
        email: session.email,
        full_name: null,
        plan_type: "free",
      };

  return (
    <SidebarProvider>
      <SessionTracker />
      <AppSidebar user={displayUser} />
      <SidebarInset className="relative overflow-hidden bg-neutral-50">
        <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-6">
          <SidebarTrigger className="-ml-1 size-8 rounded-full bg-neutral-50 text-foreground hover:bg-neutral-100 transition-colors" />
          <div className="flex-1">
            <DynamicHeader user={displayUser} />
          </div>
        </header>
        <div className="relative z-10 flex flex-1 overflow-y-auto px-6 pb-8 pt-6">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
            <TrialBanner className="border border-[#2D6EF7]/10 bg-gradient-to-r from-[#2D6EF7]/5 via-[#2D6EF7]/10 to-[#2D6EF7]/5" />
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
