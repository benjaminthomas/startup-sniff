'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlanType } from '@/types/database';

interface UsageData {
  type: 'ideas' | 'validations' | 'content';
  used: number;
  limit: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    primary: string;
    secondary: string;
    gradient: string;
    bg: string;
  };
}

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

export function UsageTracker({ planType, usage, limits, className }: UsageTrackerProps) {
  const usageData: UsageData[] = [
    {
      type: 'ideas',
      used: usage.ideas_used,
      limit: limits.ideas_per_month,
      label: 'Ideas Generated',
      icon: Lightbulb,
      color: {
        primary: 'text-purple-600',
        secondary: 'text-purple-500',
        gradient: 'from-purple-500 to-pink-500',
        bg: 'bg-purple-50',
      },
    },
    {
      type: 'validations',
      used: usage.validations_used,
      limit: limits.validations_per_month,
      label: 'Validations',
      icon: Target,
      color: {
        primary: 'text-blue-600',
        secondary: 'text-blue-500',
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
      },
    },
    {
      type: 'content',
      used: usage.content_used,
      limit: limits.content_per_month,
      label: 'Content Pieces',
      icon: TrendingUp,
      color: {
        primary: 'text-green-600',
        secondary: 'text-green-500',
        gradient: 'from-green-500 to-emerald-500',
        bg: 'bg-green-50',
      },
    },
  ];

  const getUsageStatus = (used: number, limit: number) => {
    if (limit === -1) return { status: 'unlimited', percentage: 0 };
    
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return { status: 'exceeded', percentage: 100 };
    if (percentage >= 80) return { status: 'warning', percentage };
    if (percentage >= 50) return { status: 'good', percentage };
    return { status: 'excellent', percentage };
  };

  const getPlanIcon = () => {
    return Sparkles; // Pro plans get sparkles icon
  };

  const getPlanColor = () => {
    return 'from-violet-500 to-purple-500'; // Pro plan gradient
  };

  const PlanIcon = getPlanIcon();
  const planGradient = getPlanColor();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              `bg-gradient-to-br ${planGradient}`
            )}>
              <PlanIcon className="h-4 w-4 text-white" />
            </div>
            Monthly Usage
          </CardTitle>
          <Badge variant="secondary" className="capitalize">
            {planType} Plan
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {usageData.map((item) => {
          const { status, percentage } = getUsageStatus(item.used, item.limit);
          const Icon = item.icon;
          
          return (
            <div key={item.type} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    item.color.bg
                  )}>
                    <Icon className={cn("h-4 w-4", item.color.primary)} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.limit === -1 ? (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Unlimited
                        </span>
                      ) : (
                        `${item.used} of ${item.limit}`
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {item.limit === -1 ? (
                    <Badge className={cn(
                      "text-xs font-medium",
                      "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    )}>
                      ∞ Unlimited
                    </Badge>
                  ) : status === 'exceeded' ? (
                    <Badge variant="destructive" className="text-xs">
                      Limit Reached
                    </Badge>
                  ) : status === 'warning' ? (
                    <Badge className="text-xs bg-amber-100 text-amber-800">
                      {Math.round(percentage)}% used
                    </Badge>
                  ) : (
                    <span className={cn("text-sm font-medium", item.color.secondary)}>
                      {item.limit - item.used} left
                    </span>
                  )}
                </div>
              </div>

              {item.limit !== -1 && (
                <div className="space-y-2">
                  <Progress 
                    value={percentage} 
                    className="h-2 bg-gray-200"
                  />
                  
                  {status === 'exceeded' && (
                    <p className="text-xs text-red-600 font-medium">
                      Limit reached for {item.type === 'ideas' ? 'generating ideas' : 
                                          item.type === 'validations' ? 'validating ideas' : 
                                          'creating content'}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Pro plan unlimited message */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="font-medium text-violet-800">
              You have unlimited access to all features! 🚀
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}