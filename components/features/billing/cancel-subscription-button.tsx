'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cancelSubscription } from '@/modules/billing/actions';
import { toast } from 'sonner';
import { Loader2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  isCancelled: boolean;
}

export function CancelSubscriptionButton({ subscriptionId, isCancelled }: CancelSubscriptionButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setCancelling(true);

    try {
      const result = await cancelSubscription(subscriptionId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Subscription cancelled successfully. You will have access until the end of your billing period.');
        setShowDialog(false);
        router.refresh(); // Refresh the page to show updated status
      }
    } catch {
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <XCircle className="h-4 w-4" />
        <span>Subscription will be cancelled at the end of billing period</span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Cancel Subscription
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to cancel your subscription? You will lose access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Unlimited startup idea generation</li>
                <li>Unlimited idea validations</li>
                <li>Priority support</li>
                <li>Advanced analytics</li>
              </ul>
              <p className="pt-2 font-medium">
                You will retain access until the end of your current billing period.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
