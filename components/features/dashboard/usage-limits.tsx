'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Lightbulb, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface UsageLimitsProps {
  limits: any;
}

export function UsageLimits({ limits }: UsageLimitsProps) {
  if (!limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Track your monthly usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No usage data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const ideasProgress = (limits.ideas_generated / limits.monthly_limit_ideas) * 100;
  const validationsProgress = (limits.validations_completed / limits.monthly_limit_validations) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usage & Limits</CardTitle>
            <Badge variant="outline" className="capitalize">
              {limits.plan_type} Plan
            </Badge>
          </div>
          <CardDescription>Track your monthly usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ideas Generated</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {limits.ideas_generated}/{limits.monthly_limit_ideas}
              </span>
            </div>
            <Progress value={ideasProgress} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Validations</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {limits.validations_completed}/{limits.monthly_limit_validations}
              </span>
            </div>
            <Progress value={validationsProgress} className="h-2" />
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-3">
              Limits reset on {new Date(limits.reset_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC'
              })}
            </p>
            
            {(ideasProgress > 80 || validationsProgress > 80) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-800">
                  You're approaching your monthly limit. Consider upgrading for unlimited access.
                </p>
              </div>
            )}
            
            <Button className="w-full" size="sm" asChild>
              <Link href="/dashboard/billing">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}