"use client";

import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, Loader2, ExternalLink } from "lucide-react";
import { manageBilling } from "@/modules/billing";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CurrentPlanProps {
  currentPlan: {
    id: string;
    name: string;
    price: number;
    features: string[];
    limits: {
      ideas: number;
      validations: number;
    };
  };
  subscription: {
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  hasStripeCustomerId: boolean;
}

export function CurrentPlan({
  currentPlan,
  subscription,
  hasStripeCustomerId,
}: CurrentPlanProps) {
  const [isPending, startTransition] = useTransition();

  const handleManageBilling = () => {
    startTransition(async () => {
      const result = await manageBilling();

      if (result?.error) {
        toast.error(result.error);
      }
      // Success case will redirect to Stripe Customer Portal
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </div>
          {hasStripeCustomerId && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Billing
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold capitalize">
                {currentPlan.name} Plan
              </h3>
              <Badge
                variant={currentPlan.id === "free" ? "secondary" : "default"}
              >
                {formatCurrency(currentPlan.price)}
                {currentPlan.price > 0 && "/mo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentPlan.features.slice(0, 2).join(" • ")}
            </p>
          </div>

          {subscription && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Next billing date</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(subscription.current_period_end)}
              </p>
              {subscription.cancel_at_period_end && (
                <Badge variant="destructive" className="mt-2">
                  Cancels at period end
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Usage limits */}
        <div className="space-y-4">
          <h4 className="font-semibold">Usage This Month</h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Ideas Generated</span>
                <span className="text-sm text-muted-foreground">
                  0 /{" "}
                  {currentPlan.limits.ideas === -1
                    ? "∞"
                    : currentPlan.limits.ideas}
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Validations Completed
                </span>
                <span className="text-sm text-muted-foreground">
                  0 /{" "}
                  {currentPlan.limits.validations === -1
                    ? "∞"
                    : currentPlan.limits.validations}
                </span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </div>

        {currentPlan.id === "free" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-1">
              Ready to unlock more features?
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Upgrade to generate unlimited ideas and access advanced validation
              tools.
            </p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
