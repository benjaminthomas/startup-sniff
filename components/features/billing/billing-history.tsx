'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createClient } from '@/lib/auth/supabase-client';

interface BillingTransaction {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  invoice_url: string;
}

interface BillingHistoryProps {
  userId: string;
}

export function BillingHistory({ userId }: BillingHistoryProps) {
  const [billingHistory, setBillingHistory] = useState<BillingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBillingHistory() {
      try {
        const supabase = createClient();
        
        // In a real app, this would fetch from a billing_transactions table or Stripe API
        // For now, we'll show empty state since there's no actual billing data
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        // Transform subscription data to billing history format if needed
        const transactions: BillingTransaction[] = subscriptions?.map((sub, index) => ({
          id: sub.id,
          date: sub.created_at,
          amount: sub.plan_type === 'founder' ? 19 : sub.plan_type === 'growth' ? 49 : 0,
          status: sub.status || 'active',
          description: `${sub.plan_type === 'founder' ? 'Founder' : sub.plan_type === 'growth' ? 'Growth' : 'Explorer'} Plan - Monthly`,
          invoice_url: '#', // Would come from Stripe in real implementation
        })) || [];

        setBillingHistory(transactions);
      } catch (error) {
        console.error('Error fetching billing history:', error);
        setBillingHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBillingHistory();
  }, [userId]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Billing History
        </CardTitle>
        <CardDescription>Your recent billing transactions</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading billing history...
          </div>
        ) : (
          <div className="space-y-4">
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No billing history yet
              </div>
            ) : (
              billingHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(item.date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(item.amount)}
                    </div>
                    <Badge 
                      variant={item.status === 'paid' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(item.invoice_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {billingHistory.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  );
}