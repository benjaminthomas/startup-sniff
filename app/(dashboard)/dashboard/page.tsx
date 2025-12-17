import { Metadata } from "next";
import type { StartupIdea, User as AppUser } from "@/types/global";
import type { PlanType } from "@/types/database";
import { getCurrentSession } from "@/features/auth/services/jwt";
import { UserDatabase } from "@/features/auth/services/database";
import { createServerAdminClient } from "@/features/supabase";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { RecentIdeas } from "@/features/dashboard/components/recent-ideas";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { UsageTracker } from "@/components/ui/usage-tracker";
import { getCurrentUserUsage } from "@/features/usage";
import { log } from '@/lib/logger'

export const metadata: Metadata = {
  title: "Dashboard | StartupSniff",
  description: "Your AI-powered startup idea discovery dashboard",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabaseAdmin = createServerAdminClient();

  // Try to fetch user data, but handle cases where tables don't exist yet
  let ideas: StartupIdea[] = [];
  let user: AppUser | null = null;
  let usageData: {
    usage: {
      ideas_used: number;
      validations_used: number;
      content_used: number;
    };
    limits: {
      ideas_per_month: number;
      validations_per_month: number;
      content_per_month: number;
    };
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
          plan_type:
            (dbUser.plan_type as "free" | "pro_monthly" | "pro_yearly") ||
            "free",
          razorpay_customer_id: dbUser.razorpay_customer_id || undefined,
          subscription_status:
            (dbUser.subscription_status as
              | "active"
              | "inactive"
              | "cancelled"
              | "past_due") || undefined,
          trial_ends_at: dbUser.trial_ends_at || undefined,
          created_at: dbUser.created_at || "",
          updated_at: dbUser.updated_at || "",
        };
      } else {
        // Fallback if user not found in database
        user = {
          id: session.userId,
          email: session.email,
          full_name: undefined,
          avatar_url: undefined,
          subscription_status: undefined,
          plan_type: "free",
          razorpay_customer_id: undefined,
          trial_ends_at: undefined,
          created_at: "",
          updated_at: "",
        };
      }
    }

    // Get accurate usage data using the same function as content page
    const usage = await getCurrentUserUsage();
    usageData = usage as {
      usage: {
        ideas_used: number;
        validations_used: number;
        content_used: number;
      };
      limits: {
        ideas_per_month: number;
        validations_per_month: number;
        content_per_month: number;
      };
      planType?: string;
    };

    const userIdForIdeas = user?.id ?? session?.userId ?? "";

    if (userIdForIdeas) {
      const { data: ideaRows, error: ideaError } = await supabaseAdmin
        .from("startup_ideas")
        .select("*")
        .eq("user_id", userIdForIdeas)
        .order("created_at", { ascending: false })
        .limit(10);

      if (ideaError) {
        log.error("Failed to fetch startup ideas:", ideaError);
      } else if (ideaRows) {
        ideas = ideaRows.map((ideaRaw: Record<string, unknown>) => {
          return {
            ...ideaRaw,
            target_market:
              typeof ideaRaw.target_market === "object" &&
              ideaRaw.target_market !== null
                ? ideaRaw.target_market
                : { demographic: "", size: "", pain_level: 1 },
            solution:
              typeof ideaRaw.solution === "object" && ideaRaw.solution !== null
                ? ideaRaw.solution
                : { value_proposition: "", features: [], business_model: "" },
            market_analysis:
              typeof ideaRaw.market_analysis === "object" &&
              ideaRaw.market_analysis !== null
                ? ideaRaw.market_analysis
                : { competition_level: "", timing: "", barriers: [] },
            implementation:
              typeof ideaRaw.implementation === "object" &&
              ideaRaw.implementation !== null
                ? ideaRaw.implementation
                : { complexity: 1, mvp: "", time_to_market: "" },
            success_metrics:
              typeof ideaRaw.success_metrics === "object" &&
              ideaRaw.success_metrics !== null
                ? ideaRaw.success_metrics
                : { probability_score: 0, risk_factors: [] },
          } as StartupIdea;
        });
      }
    }
  } catch (error) {
    log.error("Database query failed:", error);
    // Continue with default values
  }

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {formattedDate}
          </p>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Home
          </h1>
          <p className="text-sm text-neutral-600">
            Account details overview and analytics
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Feature Card */}
          <div
            className="rounded-2xl p-12 text-white"
            style={{
              background: 'linear-gradient(135deg, #2D6EF7 0%, #1E5EE8 100%)',
            }}
          >
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Let&apos;s create campaign for your amazing brand!
            </h2>
            <p className="text-sm opacity-90 mb-8 max-w-md">
              Discover startup ideas and validate them with AI-powered insights
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/generate'}
              className="bg-white text-[#2D6EF7] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-neutral-50 transition-all duration-200 hover:shadow-lg"
            >
              Generate Ideas
            </button>
          </div>

          {/* Recent Campaign Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-900">Recent Campaign</h3>
              <span className="text-xs text-[#2D6EF7] font-medium">Active</span>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-neutral-900">
                  {ideas[0]?.title || 'No recent ideas'}
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Today, {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-neutral-200 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-neutral-300 border-2 border-white" />
                <div className="w-8 h-8 rounded-full bg-neutral-400 border-2 border-white" />
              </div>
              {ideas[0] && (
                <button
                  onClick={() => window.location.href = `/dashboard/ideas/${ideas[0].id}`}
                  className="w-full text-[#2D6EF7] text-sm font-medium hover:underline"
                >
                  See Campaign Details
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neutral-900">Last Transaction</h2>
            <button
              onClick={() => window.location.href = '/dashboard/billing'}
              className="text-[#2D6EF7] text-sm font-medium hover:underline"
            >
              See Details
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900">
                  {usageData?.usage.ideas_used ?? ideas.length}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mt-2">
                Ideas Generated
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#EBF2FE] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#2D6EF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900">
                  {usageData?.usage.validations_used ?? ideas.filter(i => i?.is_validated).length}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mt-2">
                Validations
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions and Usage Tracker Section */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <QuickActions />
            <UsageTracker
              planType={
                ((user?.plan_type as PlanType | undefined) ??
                  (usageData?.planType as PlanType | undefined) ??
                  "free") as PlanType
              }
              usage={
                usageData?.usage ?? {
                  ideas_used: ideas.length,
                  validations_used: ideas.filter((idea) => idea?.is_validated)
                    .length,
                  content_used: 0,
                }
              }
              limits={
                usageData?.limits ??
                ((user?.plan_type as PlanType | undefined) === "pro_monthly" ||
                (user?.plan_type as PlanType | undefined) === "pro_yearly"
                  ? {
                      ideas_per_month: -1,
                      validations_per_month: -1,
                      content_per_month: -1,
                    }
                  : {
                      ideas_per_month: 3,
                      validations_per_month: 1,
                      content_per_month: 2,
                    })
              }
            />
          </div>

          <div className="space-y-6">
            <RecentIdeas ideas={ideas} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
