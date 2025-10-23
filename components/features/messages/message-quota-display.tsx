'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Send, AlertTriangle } from 'lucide-react';
import { getMessageQuotaAction } from '@/modules/reddit/actions/send-message';

interface MessageQuotaDisplayProps {
  onQuotaUpdate?: (remaining: number) => void;
}

export function MessageQuotaDisplay({ onQuotaUpdate }: MessageQuotaDisplayProps) {
  const [quota, setQuota] = useState<{
    sent: number;
    remaining: number;
    limit: number;
    resetInSeconds: number;
  } | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch quota on mount
  useEffect(() => {
    async function fetchQuota() {
      const result = await getMessageQuotaAction();
      if (result.success) {
        setQuota({
          sent: result.sent,
          remaining: result.remaining,
          limit: result.limit,
          resetInSeconds: result.resetInSeconds || 0
        });
        onQuotaUpdate?.(result.remaining);
      }
      setLoading(false);
    }
    fetchQuota();
  }, [onQuotaUpdate]);

  // Update countdown timer
  useEffect(() => {
    if (!quota) return;

    let secondsRemaining = quota.resetInSeconds;

    const interval = setInterval(() => {
      if (secondsRemaining <= 0) {
        // Quota reset! Refresh the data
        clearInterval(interval);
        setLoading(true);
        getMessageQuotaAction().then(result => {
          if (result.success) {
            setQuota({
              sent: result.sent,
              remaining: result.remaining,
              limit: result.limit,
              resetInSeconds: result.resetInSeconds || 0
            });
            onQuotaUpdate?.(result.remaining);
          }
          setLoading(false);
        });
        return;
      }

      secondsRemaining--;
      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeUntilReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset(`${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quota, onQuotaUpdate]);

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quota) {
    return null;
  }

  const percentUsed = ((quota.limit - quota.remaining) / quota.limit) * 100;
  const isLimitReached = quota.remaining === 0;
  const isWarning = quota.remaining <= 1 && quota.remaining > 0;

  return (
    <div className="space-y-3">
      {/* Main Quota Display */}
      <Card className={`border-2 ${
        isLimitReached ? 'border-red-300 bg-red-50' :
        isWarning ? 'border-orange-300 bg-orange-50' :
        'border-green-300 bg-green-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              isLimitReached ? 'bg-red-100' :
              isWarning ? 'bg-orange-100' :
              'bg-green-100'
            }`}>
              {isLimitReached ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <Send className={`w-6 h-6 ${
                  isWarning ? 'text-orange-600' : 'text-green-600'
                }`} />
              )}
            </div>

            {/* Quota Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-lg font-semibold ${
                  isLimitReached ? 'text-red-900' :
                  isWarning ? 'text-orange-900' :
                  'text-green-900'
                }`}>
                  {quota.remaining} of {quota.limit} messages remaining
                </h3>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isLimitReached ? 'bg-red-500' :
                    isWarning ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                ></div>
              </div>

              {/* Reset Timer */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {isLimitReached ? 'Resets in' : 'Quota resets in'} {timeUntilReset}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limit Reached Alert */}
      {isLimitReached && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Daily limit reached.</strong> You&apos;ve sent {quota.sent} messages today.
            Your quota will reset in {timeUntilReset}. This limit helps protect your Reddit account from spam detection.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Alert */}
      {isWarning && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Almost at your daily limit.</strong> You have {quota.remaining} message{quota.remaining === 1 ? '' : 's'} remaining.
            Use wisely! The limit resets in {timeUntilReset}.
          </AlertDescription>
        </Alert>
      )}

      {/* Info Box */}
      {!isLimitReached && !isWarning && (
        <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-900 mb-1">Why the limit?</p>
          <p className="text-blue-800">
            The {quota.limit} messages/day limit protects your Reddit account from spam detection.
            Quality over quantity leads to better response rates!
          </p>
        </div>
      )}
    </div>
  );
}
