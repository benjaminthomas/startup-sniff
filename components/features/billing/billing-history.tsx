'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBillingHistory } from '@/modules/billing/actions/billing-history';
import { Loader2, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: string;
  razorpay_payment_id: string;
  razorpay_subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

// Map Razorpay status to user-friendly display
function getStatusDisplay(status: string): { text: string; color: 'green' | 'red' | 'gray' } {
  switch (status.toLowerCase()) {
    case 'captured':
    case 'verified':
      return { text: 'Success', color: 'green' };
    case 'failed':
      return { text: 'Failed', color: 'red' };
    case 'refunded':
      return { text: 'Refunded', color: 'gray' };
    default:
      return { text: status, color: 'gray' };
  }
}

export function BillingHistory({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const result = await getBillingHistory();

      if (result.error) {
        setError(result.error);
      } else {
        setTransactions(result.transactions as Transaction[]);
      }

      setLoading(false);
    }

    fetchHistory();
  }, [userId]);

  const handleDownloadInvoice = async (transactionId: string) => {
    setDownloadingInvoice(transactionId);
    try {
      const response = await fetch(`/api/billing/invoice/${transactionId}`);
      const data = await response.json();

      if (response.ok) {
        // Open invoice URL in new tab
        window.open(data.invoice_url, '_blank');
      } else {
        alert(data.error || 'Failed to download invoice');
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      alert('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>Your recent transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No billing history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const statusDisplay = getStatusDisplay(transaction.status);
              const isDownloading = downloadingInvoice === transaction.id;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {transaction.currency.toUpperCase()} {(transaction.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Payment ID: {transaction.razorpay_payment_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusDisplay.color === 'green'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : statusDisplay.color === 'red'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {statusDisplay.text}
                    </span>

                    {/* Download Invoice Button - Only for successful payments */}
                    {statusDisplay.color === 'green' && (
                      <button
                        onClick={() => handleDownloadInvoice(transaction.id)}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Invoice"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
