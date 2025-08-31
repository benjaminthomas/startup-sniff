import { AppSidebar } from "@/components/features/dashboard/app-sidebar";
import { DynamicHeader } from "@/components/features/dashboard/dynamic-header";
import { TrialBanner } from "@/components/ui/trial-banner";
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { redirect } from 'next/navigation';
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
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Try to fetch user profile data
  let profile = null;
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (error) {
    // Use auth user data as fallback if profile doesn't exist
  }

  const displayUser = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
    plan_type: 'explorer',
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <DynamicHeader user={displayUser} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <TrialBanner />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}