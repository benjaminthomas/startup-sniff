import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/features/auth/services/jwt';
import { createServerAdminClient } from '@/features/supabase';
import { fetchInvoice, fetchInvoicesByPayment, createInvoice } from '@/services/payments/razorpay';
import { log } from '@/lib/logger'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ payment_id: string }> }
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Await params in Next.js 15
  const params = await context.params;
  const supabase = createServerAdminClient();

  try {
    // 1. Fetch payment transaction from database
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('razorpay_invoice_id, razorpay_invoice_url, razorpay_payment_id, razorpay_subscription_id, user_id, amount, currency')
      .eq('id', params.payment_id)
      .single();

    const typedTransaction = transaction as {
      razorpay_invoice_id: string | null;
      razorpay_invoice_url: string | null;
      razorpay_payment_id: string;
      razorpay_subscription_id: string | null;
      user_id: string;
      amount: number;
      currency: string;
    } | null

    if (error || !typedTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 2. Verify user owns this transaction (security check)
    if (typedTransaction.user_id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Fetch or generate invoice from Razorpay
    let invoice;

    if (typedTransaction.razorpay_invoice_id) {
      // Use stored invoice ID (preferred fast path)
      try {
        invoice = await fetchInvoice(typedTransaction.razorpay_invoice_id);
      } catch (fetchError) {
        log.error('Failed to fetch invoice by ID:', fetchError);
        // Fall through to payment_id lookup
      }
    }

    if (!invoice) {
      // Fallback: Query by payment ID
      try {
        const invoices = await fetchInvoicesByPayment(typedTransaction.razorpay_payment_id);

        if (invoices.items && invoices.items.length > 0) {
          invoice = invoices.items[0];

          // Store invoice ID for future lookups
          await supabase
            .from('payment_transactions' as never)
            .update({
              razorpay_invoice_id: invoice.id,
              razorpay_invoice_url: invoice.short_url,
              invoice_generated_at: new Date().toISOString(),
            } as never)
            .eq('id', params.payment_id);
        }
      } catch (queryError) {
        log.error('Failed to query invoices by payment ID:', queryError);
      }
    }

    // If still no invoice, generate one
    if (!invoice) {
      try {
        // Get user details for invoice
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name, razorpay_customer_id')
          .eq('id', typedTransaction.user_id)
          .single();

        const typedUser = user as { email: string; full_name: string | null; razorpay_customer_id: string | null } | null

        if (!typedUser || !typedUser.razorpay_customer_id) {
          return NextResponse.json({
            error: 'Unable to generate invoice: customer information missing'
          }, { status: 500 });
        }

        // Create new invoice
        invoice = await createInvoice({
          customerId: typedUser.razorpay_customer_id,
          amount: typedTransaction.amount,
          currency: typedTransaction.currency || 'INR',
          description: 'StartupSniff Pro Subscription',
          customer_email: typedUser.email,
          customer_name: typedUser.full_name || typedUser.email.split('@')[0],
          payment_id: typedTransaction.razorpay_payment_id,
        });

        // Store invoice ID and URL
        await supabase
          .from('payment_transactions' as never)
          .update({
            razorpay_invoice_id: invoice.id,
            razorpay_invoice_url: invoice.short_url,
            invoice_generated_at: new Date().toISOString(),
          } as never)
          .eq('id', params.payment_id);

        log.info(`Generated new invoice ${invoice.id} for payment ${typedTransaction.razorpay_payment_id}`);
      } catch (createError) {
        log.error('Failed to create invoice:', createError);
        return NextResponse.json({
          error: 'Failed to generate invoice'
        }, { status: 500 });
      }
    }

    // 4. Return invoice download URL and metadata
    return NextResponse.json({
      invoice_url: invoice.short_url,
      invoice_id: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
    });
  } catch (error) {
    log.error('Invoice fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch invoice'
    }, { status: 500 });
  }
}
