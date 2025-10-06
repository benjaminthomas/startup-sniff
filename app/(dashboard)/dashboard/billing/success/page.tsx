import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Route } from 'next';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardShell } from '@/components/features/dashboard/dashboard-shell';

export const metadata: Metadata = {
  title: 'Payment Successful | StartupSniff',
  description: 'Your subscription has been activated successfully',
};

function SuccessContent() {
  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your subscription has been activated and you now have access to all premium features.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">What&apos;s next?</h3>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>• Generate unlimited AI-powered startup ideas</li>
                <li>• Access advanced market validation tools</li>
                <li>• Create professional content for your ideas</li>
                <li>• Export your research to PDF and Notion</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard/generate">
                  Generate Your First Idea
                </Link>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Need help getting started?{' '}
              <Link href={"/support" as Route} className="text-primary hover:underline">
                Contact our support team
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardShell>
    }>
      <SuccessContent />
    </Suspense>
  );
}