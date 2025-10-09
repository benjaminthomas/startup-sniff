import { AppSidebar } from "@/components/features/dashboard/app-sidebar";
import { DynamicHeader } from "@/components/features/dashboard/dynamic-header";
import { TrialBanner } from "@/components/ui/trial-banner";
import { getCurrentSession, UserDatabase } from "@/modules/auth";
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
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <DynamicHeader user={displayUser} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 bg-background">
          <TrialBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
