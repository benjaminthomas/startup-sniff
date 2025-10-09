'use client';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  X,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanType } from '@/types/database';

interface UnlockOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  featureType: 'ideas' | 'validations' | 'content';
  currentPlan: PlanType;
  usedCount: number;
  limitCount: number;
}

export function UnlockOverlay({
  isVisible,
  onClose,
  featureType,
  currentPlan,
}: UnlockOverlayProps) {
  // Pro users have unlimited access, so they should never see this overlay
  // This is just a safety fallback
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <Card className="w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
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
            <CardTitle>You Have Unlimited Access!</CardTitle>
            <CardDescription>
              Your Pro plan includes unlimited {featureType}. This message shouldn&apos;t appear.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-lg bg-violet-50 border border-violet-200">
              <CheckCircle className="h-5 w-5 text-violet-600" />
              <p className="text-sm font-medium text-violet-900">
                No limits on your Pro {currentPlan === 'pro_yearly' ? 'Yearly' : 'Monthly'} plan
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
