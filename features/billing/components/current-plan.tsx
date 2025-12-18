"use client";
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
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Settings, TrendingUp, FileText, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { CancelSubscriptionButton } from './cancel-subscription-button';
import { log } from '@/lib/logger/client'

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
    razorpay_subscription_id: string | null;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
  } | null;
  hasRazorpayCustomerId: boolean;
}

export function CurrentPlan({
  currentPlan,
  subscription,
  hasRazorpayCustomerId,
}: CurrentPlanProps) {
  const handleUpgradeToYearly = () => {
    // Scroll to pricing cards section
    const pricingSection = document.querySelector('#pricing-cards');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewInvoices = () => {
    // Scroll to billing history section
    const billingHistory = document.querySelector('#billing-history');
    if (billingHistory) {
      billingHistory.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownloadLatestInvoice = async () => {
    try {
      // Get latest payment transaction
      const response = await fetch('/api/billing/history');
      const data = await response.json();

      if (data.transactions && data.transactions.length > 0) {
        const latestTransaction = data.transactions[0];
        // Download invoice for latest transaction
        const invoiceResponse = await fetch(`/api/billing/invoice/${latestTransaction.id}`);
        const invoiceData = await invoiceResponse.json();

        if (invoiceResponse.ok && invoiceData.invoice_url) {
          window.open(invoiceData.invoice_url, '_blank');
        } else {
          toast.error('No invoice available');
        }
      } else {
        toast.error('No invoices found');
      }
    } catch (error) {
      log.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
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
          {hasRazorpayCustomerId && currentPlan.id !== 'free' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Subscription
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {currentPlan.id === 'pro_monthly' && (
                  <>
                    <DropdownMenuItem onClick={handleUpgradeToYearly}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Upgrade to Yearly (Save 17%)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleViewInvoices}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Invoices
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadLatestInvoice}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Latest Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

          {subscription && subscription.razorpay_subscription_id && subscription.current_period_end && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{subscription.status || 'active'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next Billing Date</span>
                <span className="font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {subscription.cancel_at_period_end && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Your subscription will be cancelled at the end of the billing period</span>
                </div>
              )}
              {subscription.razorpay_subscription_id.startsWith('manual_') && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Manual Subscription - Managed directly. Consider upgrading to unlock full management features.
                  </span>
                </div>
              )}

              <Separator className="my-2" />

              <CancelSubscriptionButton
                subscriptionId={subscription.razorpay_subscription_id}
                isCancelled={subscription.cancel_at_period_end || false}
              />
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
