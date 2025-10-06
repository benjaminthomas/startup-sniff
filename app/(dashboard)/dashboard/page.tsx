import { Metadata } from 'next';
import type { StartupIdea, User as AppUser } from '@/types/global';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { getCurrentSession } from '@/lib/auth/jwt';
import { UserDatabase } from '@/lib/auth/database';
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
    // Use JWT session instead of Supabase auth
    const session = await getCurrentSession();

    if (session) {
      // Get user data from our JWT-based auth system
      const dbUser = await UserDatabase.findById(session.userId);

      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          full_name: dbUser.full_name || undefined,
          avatar_url: dbUser.avatar_url || undefined,
          plan_type: (dbUser.plan_type as 'explorer' | 'founder' | 'growth') || 'explorer',
          stripe_customer_id: dbUser.stripe_customer_id || undefined,
          subscription_status: dbUser.subscription_status || undefined,
          trial_ends_at: dbUser.trial_ends_at || undefined,
          created_at: dbUser.created_at || '',
          updated_at: dbUser.updated_at || '',
        };
      } else {
        // Fallback if user not found in database
        user = {
          id: session.userId,
          email: session.email,
          full_name: undefined,
          avatar_url: undefined,
          subscription_status: undefined,
          plan_type: 'explorer',
          stripe_customer_id: undefined,
          trial_ends_at: undefined,
          created_at: '',
          updated_at: '',
        };
      }
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
              <RecentIdeas ideas={ideas} />
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