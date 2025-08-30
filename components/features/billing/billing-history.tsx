'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BillingHistoryProps {
  userId: string;
}

// Mock billing history data - in real app, fetch from Stripe
const mockBillingHistory = [
  {
    id: '1',
    date: '2024-08-29',
    amount: 19,
    status: 'paid',
    description: 'Founder Plan - Monthly',
    invoice_url: '#',
  },
  {
    id: '2',
    date: '2024-07-29',
    amount: 19,
    status: 'paid',
    description: 'Founder Plan - Monthly',
    invoice_url: '#',
  },
  {
    id: '3',
    date: '2024-06-29',
    amount: 19,
    status: 'paid',
    description: 'Founder Plan - Monthly',
    invoice_url: '#',
  },
];

export function BillingHistory({ userId }: BillingHistoryProps) {
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
        <div className="space-y-4">
          {mockBillingHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No billing history yet
            </div>
          ) : (
            mockBillingHistory.map((item) => (
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
        </div>

        {mockBillingHistory.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button variant="outline">Load More</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}