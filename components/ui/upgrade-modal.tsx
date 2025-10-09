"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlanType } from "@/types/database";

interface UpgradeModalProps {
  isVisible: boolean;
  onClose: () => void;
  featureType: "ideas" | "validations" | "content";
  currentPlan: PlanType;
  usedCount: number;
  limitCount: number;
}

export function UpgradeModal({
  isVisible,
  onClose,
  featureType,
  currentPlan,
}: UpgradeModalProps) {
  if (!isVisible) return null;

  // Show different content based on plan type
  const isProUser =
    currentPlan === "pro_monthly" || currentPlan === "pro_yearly";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <Card
          className="w-full max-w-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-violet-100">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            {isProUser ? (
              <>
                <CardTitle>You Have Unlimited Access!</CardTitle>
                <CardDescription>
                  Your Pro plan includes unlimited {featureType}. This message
                  shouldn&apos;t appear.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  You&apos;ve reached your free plan limit for {featureType}.
                  Upgrade to Pro for unlimited access.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {isProUser ? (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-violet-50 border border-violet-200">
                <CheckCircle className="h-5 w-5 text-violet-600" />
                <p className="text-sm font-medium text-violet-900">
                  No limits on your Pro{" "}
                  {currentPlan === "pro_yearly" ? "Yearly" : "Monthly"} plan
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                  <X className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-900">
                    Free plan limit reached
                  </p>
                </div>
                <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-900">
                    Pro plan: Unlimited {featureType}
                  </p>
                </div>
              </div>
            )}

            {isProUser ? (
              <div className="w-full text-center">
                <p className="text-sm text-muted-foreground">
                  Contact support if you&apos;re seeing this message by mistake.
                </p>
                <Button
                  onClick={onClose}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => window.open("/dashboard", "_blank")}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                >
                  Upgrade to Pro
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Continue with Free
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
