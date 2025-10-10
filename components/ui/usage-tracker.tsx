"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanType } from "@/types/database";

type UsageMetric = {
  key: "ideas" | "validations" | "content";
  used: number;
  limit: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: {
    chipBg: string;
    iconColor: string;
    dotColor: string;
  };
};

interface UsageTrackerProps {
  planType: PlanType;
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
  className?: string;
}

export function UsageTracker({
  planType,
  usage,
  limits,
  className,
}: UsageTrackerProps) {
  const isUnlimitedPlan = (value: number) => value === -1 || value <= 0;

  const metrics: UsageMetric[] = [
    {
      key: "ideas",
      used: usage.ideas_used,
      limit: limits.ideas_per_month,
      label: "Ideas Generated",
      icon: Lightbulb,
      accent: {
        chipBg: "bg-purple-50",
        iconColor: "text-purple-600",
        dotColor: "bg-purple-400",
      },
    },
    {
      key: "validations",
      used: usage.validations_used,
      limit: limits.validations_per_month,
      label: "Validations",
      icon: Target,
      accent: {
        chipBg: "bg-sky-50",
        iconColor: "text-sky-600",
        dotColor: "bg-sky-400",
      },
    },
    {
      key: "content",
      used: usage.content_used,
      limit: limits.content_per_month,
      label: "Content Pieces",
      icon: TrendingUp,
      accent: {
        chipBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        dotColor: "bg-emerald-400",
      },
    },
  ];

  const totalUsed = metrics.reduce((sum, metric) => sum + metric.used, 0);
  const formattedPlan = planType.replace("_", " ");

  const planSummary = [
    `${limits.ideas_per_month === -1 ? "∞" : limits.ideas_per_month} ideas`,
    `${limits.validations_per_month === -1 ? "∞" : limits.validations_per_month} validation${
      limits.validations_per_month === 1 ? "" : "s"
    }`,
    `${limits.content_per_month === -1 ? "∞" : limits.content_per_month} content`,
  ].join(" · ");

  return (
    <Card
      className={cn(
        "w-full border border-violet-100/70 bg-white/95 shadow-sm shadow-violet-200/40 backdrop-blur",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-sm shadow-violet-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            Monthly Usage
          </CardTitle>
          <Badge className="border-none bg-violet-100/80 px-3 py-1 text-xs font-medium capitalize text-violet-700 shadow-none">
            {formattedPlan} plan
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 grid-cols-1 2xl:grid-cols-3 3xl:grid-cols-6">
          <div className="col-span-1 2xl:col-span-3 3xl:col-span-6 flex h-full flex-col justify-between gap-6 rounded-3xl border border-violet-100/80 bg-white/90 p-6 shadow-inner shadow-violet-100/40">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/70">
                Total used
              </p>
              <div className="mt-3 text-4xl font-semibold text-foreground">
                {totalUsed.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {planType === "free"
                  ? "Usage resets on your next billing cycle."
                  : "You’re tracking overall activity this cycle."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => {
                const isUnlimited = isUnlimitedPlan(metric.limit);
                const remaining = isUnlimited
                  ? null
                  : Math.max(metric.limit - metric.used, 0);

                return (
                  <div
                    key={metric.key}
                    className="rounded-2xl border border-slate-100 bg-white/95 px-4 py-3 shadow-sm shadow-slate-200/40"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          metric.accent.chipBg,
                          metric.accent.iconColor
                        )}
                      >
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {metric.label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-lg font-semibold text-foreground">
                        {metric.used.toLocaleString()}
                      </span>
                      {!isUnlimited && (
                        <span className="text-xs text-muted-foreground">
                          / {metric.limit.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {isUnlimited
                        ? "Unlimited access"
                        : `${remaining?.toLocaleString()} remaining`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-violet-100/80 bg-violet-50/70 px-4 py-3 text-xs text-violet-700">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span>{planSummary}</span>
            </div>
          </div>

          {metrics.map((metric) => {
            const isUnlimited = isUnlimitedPlan(metric.limit);
            const percentage = isUnlimited
              ? null
              : Math.min(
                  100,
                  Math.round(
                    (metric.used / Math.max(metric.limit, 1)) * 100
                  )
                );
            const remaining = isUnlimited
              ? null
              : Math.max(metric.limit - metric.used, 0);
            const hasReachedLimit =
              !isUnlimited && remaining !== null && remaining <= 0;

            return (
              <div
                key={metric.key}
                className="relative flex flex-col justify-between rounded-3xl border border-violet-100/70 bg-white/92 px-5 py-6 text-left shadow-sm shadow-violet-200/30 col-span-1 2xl:col-span-1 3xl:col-span-2"
              >
                <span className="pointer-events-none absolute left-5 top-5 h-3 w-3 rounded-tl-lg border border-violet-200/70 border-b-0 border-r-0" />
                <span className="pointer-events-none absolute right-5 top-5 h-3 w-3 rounded-tr-lg border border-violet-200/70 border-b-0 border-l-0" />

                <div className="flex items-start justify-between gap-4 text-foreground">
                  <div>
                    <span className="text-3xl font-semibold">
                      {percentage === null ? "∞" : `${percentage}%`}
                    </span>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground/70">
                      Used
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-violet-100/80 bg-violet-50/70 px-3 py-1 text-xs font-medium text-violet-700">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        metric.accent.dotColor
                      )}
                    />
                    {metric.label}
                  </div>
                </div>

                <div className="mt-8 space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {metric.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isUnlimited
                      ? `${metric.used.toLocaleString()} generated this cycle`
                      : `${metric.used.toLocaleString()} of ${metric.limit.toLocaleString()} used`}
                  </p>
                  {isUnlimited ? null : (
                    <p
                      className={cn(
                        "text-xs",
                        hasReachedLimit
                          ? "font-medium text-rose-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {hasReachedLimit
                        ? "Limit reached — upgrade to continue."
                        : `${remaining?.toLocaleString()} remaining`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {planType === "free" && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-700">
            <span className="font-medium">Free plan tip:</span> Upgrade to unlock
            more ideas, additional validations, and unlimited content creation.
          </div>
        )}

        {(planType === "pro_monthly" || planType === "pro_yearly") && (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm text-violet-700">
            <Sparkles className="mr-2 inline h-4 w-4" />
            Enjoy unlimited access across the platform — you&apos;re on the{" "}
            <span className="font-medium">Pro</span> plan.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
