'use client';

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Crown, 
  Sparkles, 
  ArrowUp,
  Target,
  Lightbulb,
  TrendingUp,
  X,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
  isVisible: boolean;
  onClose: () => void;
  featureType: 'ideas' | 'validations' | 'content';
  currentPlan: 'explorer' | 'founder' | 'growth';
  usedCount: number;
  limitCount: number;
  className?: string;
}

// Following StartupSniff design system - using design tokens and shadcn/ui standards
const FEATURE_CONFIG = {
  ideas: {
    icon: Lightbulb,
    title: 'idea generation',
    description: 'ai-powered startup ideas',
    verb: 'generating ideas',
  },
  validations: {
    icon: Target,
    title: 'market validation', 
    description: 'comprehensive market research',
    verb: 'validating ideas',
  },
  content: {
    icon: TrendingUp,
    title: 'content creation',
    description: 'marketing content pieces', 
    verb: 'creating content',
  },
} as const;

const PLAN_CONFIG = {
  founder: {
    name: 'Founder',
    price: 19,
    icon: Crown,
    features: [
      { icon: Lightbulb, text: '25 ideas per month' },
      { icon: Target, text: '10 validations per month' },
      { icon: TrendingUp, text: '50 content pieces' },
      { icon: Sparkles, text: 'Premium templates' },
      { icon: CheckCircle, text: 'PDF exports' },
    ],
  },
  growth: {
    name: 'Growth',
    price: 49,
    icon: Sparkles,
    features: [
      { icon: Lightbulb, text: 'Unlimited ideas' },
      { icon: Target, text: 'Unlimited validations' },
      { icon: TrendingUp, text: 'Unlimited content' },
      { icon: Sparkles, text: 'API access' },
      { icon: CheckCircle, text: 'Priority support' },
    ],
  },
} as const;

export function UpgradeModal({
  isVisible,
  onClose,
  featureType,
  currentPlan,
  usedCount,
  limitCount,
  className
}: UpgradeModalProps) {
  const feature = FEATURE_CONFIG[featureType];
  const FeatureIcon = feature.icon;
  const nextPlan = currentPlan === 'explorer' ? 'founder' : 'growth';
  const planConfig = PLAN_CONFIG[nextPlan];
  const PlanIcon = planConfig.icon;
  
  const usagePercentage = (usedCount / limitCount) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardHeader className="text-center pb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <FeatureIcon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                
                <CardTitle className="text-xl">You've reached your {feature.title} limit!</CardTitle>
                <CardDescription>
                  You've used <strong>{usedCount} of {limitCount}</strong> {feature.description} this month
                </CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Monthly Usage</span>
                    <span>{usedCount}/{limitCount}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-center text-sm text-muted-foreground">
                  Upgrade to continue {feature.verb}! 🚀
                </p>

                {/* Plan Card */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="mb-2">
                        Most Popular
                      </Badge>
                      <PlanIcon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{planConfig.name} Plan</CardTitle>
                    <CardDescription className="text-2xl font-bold text-primary">
                      ${planConfig.price}/month
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {planConfig.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <feature.icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link href="/dashboard/billing">
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onClose}
                  >
                    Maybe Later
                  </Button>
                </div>

                {/* Trust Signals */}
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Cancel anytime
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    14-day free trial
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}