import { Metadata } from 'next';
import type { StartupIdea, User as AppUser } from '@/types/global';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { DashboardShell } from '@/components/features/dashboard/dashboard-shell';
import { StatsCards } from '@/components/features/dashboard/stats-cards';
import { RecentIdeas } from '@/components/features/dashboard/recent-ideas';
import { QuickActions } from '@/components/features/dashboard/quick-actions';
import { UsageTracker } from '@/components/ui/usage-tracker';
import { getCurrentUserUsage } from '@/server/actions/usage';

export const metadata: Metadata = {
  title: 'Dashboard | StartupSniff',
  description: 'Your AI-powered startup idea discovery dashboard',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Try to fetch user data, but handle cases where tables don't exist yet
  let ideas: StartupIdea[] = [];
  let user: AppUser | null = null;
  let usageData: {
    usage: { ideas_used: number; validations_used: number; content_used: number };
    limits: { ideas_per_month: number; validations_per_month: number; content_per_month: number };
    planType?: string;
  } | null = null;

  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      // Try to fetch user profile data
      const { data: profileRaw } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let profile: AppUser | null = null;
      if (profileRaw) {
        // Patch avatar_url and plan_type to match User interface
        profile = {
          ...profileRaw,
          avatar_url: typeof profileRaw.avatar_url === 'string' ? profileRaw.avatar_url : undefined,
          plan_type: typeof profileRaw.plan_type === 'string' && ['explorer', 'founder', 'growth'].includes(profileRaw.plan_type)
            ? profileRaw.plan_type as 'explorer' | 'founder' | 'growth'
            : undefined,
          stripe_customer_id: typeof profileRaw.stripe_customer_id === 'string' ? profileRaw.stripe_customer_id : undefined,
        };
      }
      user = profile || {
  id: authUser.id,
  email: authUser.email || '',
  full_name: typeof authUser.user_metadata?.full_name === 'string' ? authUser.user_metadata.full_name : undefined,
  avatar_url: typeof authUser.user_metadata?.avatar_url === 'string' ? authUser.user_metadata.avatar_url : undefined,
  subscription_status: undefined,
  plan_type: 'explorer',
  stripe_customer_id: undefined,
  trial_ends_at: undefined,
  created_at: '',
  updated_at: '',
      };
    }

    // Get accurate usage data using the same function as content page
    const usage = await getCurrentUserUsage();
    usageData = usage as {
      usage: { ideas_used: number; validations_used: number; content_used: number };
      limits: { ideas_per_month: number; validations_per_month: number; content_per_month: number };
      planType?: string;
    };

    const startupIdeas = await supabase
      .from('startup_ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (startupIdeas.data) {
      // Patch for legacy/JSON fields
      ideas = startupIdeas.data.map((ideaRaw: Record<string, unknown>) => {
        return {
          ...ideaRaw,
          target_market: typeof ideaRaw.target_market === 'object' && ideaRaw.target_market !== null ? ideaRaw.target_market : { demographic: '', size: '', pain_level: 1 },
          solution: typeof ideaRaw.solution === 'object' && ideaRaw.solution !== null ? ideaRaw.solution : { value_proposition: '', features: [], business_model: '' },
          market_analysis: typeof ideaRaw.market_analysis === 'object' && ideaRaw.market_analysis !== null ? ideaRaw.market_analysis : { competition_level: '', timing: '', barriers: [] },
          implementation: typeof ideaRaw.implementation === 'object' && ideaRaw.implementation !== null ? ideaRaw.implementation : { complexity: 1, mvp: '', time_to_market: '' },
          success_metrics: typeof ideaRaw.success_metrics === 'object' && ideaRaw.success_metrics !== null ? ideaRaw.success_metrics : { probability_score: 0, risk_factors: [] },
        } as StartupIdea;
      });
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
            Here&apos;s what&apos;s happening with your startup ideas today.
          </p>
        </div>
        
        <div className="grid gap-6">
          <StatsCards 
            totalIdeas={ideas.length}
            validatedIdeas={ideas.filter(idea => idea?.is_validated).length}
            favoriteIdeas={ideas.filter(idea => idea?.is_favorite).length}
            planType={(user?.plan_type as 'explorer' | 'founder' | 'growth') || 'explorer'}
          />
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <QuickActions />
              <RecentIdeas ideas={ideas as any[]} />
            </div>
            
            <div className="space-y-6">
              <UsageTracker
                planType={(user?.plan_type as 'explorer' | 'founder' | 'growth') || 'explorer'}
                usage={usageData?.usage ?? {
                  ideas_used: ideas.length,
                  validations_used: ideas.filter(idea => idea?.is_validated).length,
                  content_used: 0,
                }}
                limits={usageData?.limits ?? {
                  ideas_per_month: user?.plan_type === 'explorer' ? 3 : user?.plan_type === 'founder' ? 25 : -1,
                  validations_per_month: user?.plan_type === 'explorer' ? 1 : user?.plan_type === 'founder' ? 10 : -1,
                  content_per_month: user?.plan_type === 'explorer' ? 5 : user?.plan_type === 'founder' ? 50 : -1,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}