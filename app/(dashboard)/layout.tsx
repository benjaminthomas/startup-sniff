import { AppSidebar } from "@/components/features/dashboard/app-sidebar";
import { DynamicHeader } from "@/components/features/dashboard/dynamic-header";
import { TrialBanner } from "@/components/ui/trial-banner";
import { SessionTracker } from "@/components/analytics/session-tracker";
import { getCurrentSession } from "@/modules/auth/services/jwt";
import { UserDatabase } from "@/modules/auth/services/database";
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
      <SidebarInset className="relative overflow-hidden bg-[radial-gradient(100%_120%_at_50%_0%,rgba(124,58,237,0.18),rgba(124,58,237,0.04)_45%,transparent_80%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:120px_120px]"
        />
        <header className="sticky top-4 z-30 mx-3 mt-4 flex h-16 shrink-0 items-center gap-2 rounded-2xl border border-white/60 bg-white/85 px-4 shadow-[0px_8px_24px_-16px_rgba(124,58,237,0.25)] backdrop-blur-sm sm:mx-6 sm:px-6">
          <SidebarTrigger className="-ml-1 size-8 rounded-full bg-white/80 text-foreground shadow-sm hover:bg-white" />
          <div className="flex-1">
            <DynamicHeader user={displayUser} />
          </div>
        </header>
        <div className="relative z-10 flex flex-1 overflow-y-auto px-3 pb-8 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto flex w-full flex-col gap-6">
            <TrialBanner className="border-none bg-gradient-to-r from-primary/10 via-indigo-500/10 to-sky-400/10 shadow-[0px_8px_24px_-18px_rgba(124,58,237,0.28)] backdrop-blur-sm" />
            <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0px_18px_45px_-28px_rgba(124,58,237,0.3)] backdrop-blur-sm sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
