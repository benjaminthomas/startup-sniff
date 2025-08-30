import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { DashboardShell } from '@/components/features/dashboard/dashboard-shell';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RecentIdeas } from '@/components/features/dashboard/recent-ideas';
import { QuickActions } from '@/components/features/dashboard/quick-actions';
import { UsageLimits } from '@/components/features/dashboard/usage-limits';

export const metadata: Metadata = {
  title: 'Dashboard | StartupSniff',
  description: 'Your AI-powered startup idea discovery dashboard',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Try to fetch user data, but handle cases where tables don't exist yet
  let ideas: any[] = [];
  let limits = null;
  let user = null;

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // Try to fetch user profile data
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      user = profile || {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || null,
        plan_type: 'explorer',
      };
    }

    const [startupIdeas, usageLimits] = await Promise.allSettled([
      supabase
        .from('startup_ideas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('usage_limits')
        .select('*')
        .single(),
    ]);

    if (startupIdeas.status === 'fulfilled' && startupIdeas.value.data) {
      ideas = startupIdeas.value.data;
    }
    if (usageLimits.status === 'fulfilled' && usageLimits.value.data) {
      limits = usageLimits.value.data;
    }
  } catch (error) {
    console.error('Database query failed:', error);
    // Continue with default values
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your startup ideas today.
          </p>
        </div>
        
        <div className="grid gap-6">
          <StatsCards 
            totalIdeas={ideas.length}
            validatedIdeas={ideas.filter(idea => idea?.is_validated).length}
            favoriteIdeas={ideas.filter(idea => idea?.is_favorite).length}
            planType={'explorer'}
          />
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <QuickActions />
              <RecentIdeas ideas={ideas} />
            </div>
            
            <div className="space-y-6">
              <UsageLimits limits={limits} />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}