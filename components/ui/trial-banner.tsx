"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Clock, Zap } from "lucide-react";
import { createClient } from "@/lib/auth/supabase-client";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  className?: string;
}

export function TrialBanner({ className }: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkTrialStatus() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user profile to check trial status
        const { data: profile, error } = await supabase
          .from("users")
          .select("plan_type, trial_ends_at, created_at")
          .eq("id", user.id)
          .single();

        if (error || !profile) {
          console.error("Error fetching user profile:", error);
          setIsLoading(false);
          return;
        }

        // Type guard to ensure we have proper profile data
        if (
          typeof profile !== "object" ||
          !profile ||
          typeof (profile as Record<string, unknown>).plan_type !== "string"
        ) {
          setIsLoading(false);
          return;
        }

        // Only show banner for trial users (free plan)
        if ((profile as Record<string, unknown>).plan_type !== "free") {
          setIsLoading(false);
          return;
        }

        // Calculate trial end date (7 days from creation or trial_ends_at if set)
        const trialEndDate = (profile as Record<string, unknown>).trial_ends_at
          ? new Date(
              (profile as Record<string, unknown>).trial_ends_at as string
            )
          : new Date(
              new Date(
                (profile as Record<string, unknown>).created_at as string
              ).getTime() +
                7 * 24 * 60 * 60 * 1000
            );

        const now = new Date();
        const timeDiff = trialEndDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysLeft > 0) {
          setDaysRemaining(daysLeft);
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Error checking trial status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkTrialStatus();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleUpgrade = () => {
    window.location.href = "/dashboard/billing";
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/30",
        className
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full dark:bg-amber-900/30">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                Trial ends in {daysRemaining} day
                {daysRemaining !== 1 ? "s" : ""}
              </span>
              {daysRemaining <= 3 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400">
                  Act Soon!
                </span>
              )}
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Upgrade to continue using all features after your trial expires
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-sm"
          >
            <Zap className="w-4 h-4 mr-1" />
            Upgrade Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
