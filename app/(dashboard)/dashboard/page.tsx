import { Metadata } from "next";
import type { StartupIdea, User as AppUser } from "@/types/global";
import type { PlanType } from "@/types/database";
import { getCurrentSession } from "@/modules/auth/services/jwt";
import { UserDatabase } from "@/modules/auth/services/database";
import { createServerAdminClient } from "@/modules/supabase";
import { DashboardShell } from "@/components/features/dashboard/dashboard-shell";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { RecentIdeas } from "@/components/features/dashboard/recent-ideas";
import { QuickActions } from "@/components/features/dashboard/quick-actions";
import { UsageTracker } from "@/components/ui/usage-tracker";
import { getCurrentUserUsage } from "@/modules/usage";
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
  const greetingName =
    user?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-sky-400/10 p-6 shadow-sm shadow-primary/15">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                {formattedDate}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Hello, {greetingName}!
              </h1>
              <p className="text-lg font-medium leading-snug text-transparent bg-gradient-to-r from-primary via-sky-500 to-blue-500 bg-clip-text">
                How can I help you today?
              </p>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with your startup ideas today.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <StatsCards
            totalIdeas={usageData?.usage.ideas_used ?? ideas.length}
            validatedIdeas={
              usageData?.usage.validations_used ??
              ideas.filter((idea) => idea?.is_validated).length
            }
            favoriteIdeas={ideas.filter((idea) => idea?.is_favorite).length}
            planType={
              (user?.plan_type as "free" | "pro_monthly" | "pro_yearly") ||
              "free"
            }
          />

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
      </div>
    </DashboardShell>
  );
}
