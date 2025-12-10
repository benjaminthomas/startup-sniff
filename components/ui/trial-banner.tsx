import { getTrialStatus } from '@/modules/billing/actions/trial-status';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TrialBannerProps {
  className?: string;
}

/**
 * Trial banner - Server component that displays trial status
 * Fetches data server-side using server actions
 */
export async function TrialBanner({ className }: TrialBannerProps) {
  const trialStatus = await getTrialStatus();

  // Don't show banner if user not logged in or not on trial
  if (!trialStatus || !trialStatus.isTrialActive) {
    return null;
  }

  const { daysRemaining } = trialStatus;

  return (
    <Card
      className={cn(
        'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800/30',
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
                {daysRemaining !== null && daysRemaining > 0 ? (
                  <>
                    Trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>Your trial has expired</>
                )}
              </span>
              {daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && (
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
            asChild
            size="sm"
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-sm"
          >
            <Link href="/dashboard/billing">
              <Zap className="w-4 h-4 mr-1" />
              Upgrade Now
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
