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
        
        // Subscriptions table not yet implemented - showing empty state
        const transactions: BillingTransaction[] = [];

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