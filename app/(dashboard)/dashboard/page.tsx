import { Metadata } from "next";
import Link from "next/link";
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

        {/* Welcome Section - Only show if user has no ideas */}
        {ideas.length === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Welcome to StartupSniff
              </h2>
              <p className="text-neutral-600 mb-6">
                Discover and validate startup ideas powered by AI-driven Reddit insights. Get started by generating your first idea.
              </p>
              <Link
                href="/dashboard/generate"
                className="inline-flex items-center bg-[#2D6EF7] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#1E5EE8] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate Your First Idea
              </Link>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-neutral-900">Your Activity</h2>
            <Link
              href="/dashboard/billing"
              className="text-[#2D6EF7] text-sm font-medium hover:underline"
            >
              View Usage Details
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-neutral-900">
                  {usageData?.usage.content_used ?? 0}
                </span>
              </div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mt-2">
                Content Generated
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
