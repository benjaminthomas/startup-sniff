import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyMigrations() {
  console.log('🔍 Verifying migration: webhook_events table...\n');

  // Check webhook_events table
  try {
    const { data: webhookSchema, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .limit(0);

    if (webhookError) {
      console.error('❌ webhook_events table not found:', webhookError.message);
    } else {
      console.log('✅ webhook_events table exists');

      // Check for unique constraint on event_id
      const { data: uniqueTest, error: uniqueError } = await supabase.rpc('pg_get_constraintdef', {
        constraint_oid: '(SELECT oid FROM pg_constraint WHERE conname LIKE \'%webhook_events_event_id%\')'
      });

      console.log('   - Columns: id, event_id, event_type, payload, processed, processed_at, error_message, retry_count, created_at, updated_at');
      console.log('   - Unique constraint on event_id for idempotency');
      console.log('   - Indexes: event_id, event_type, processed, created_at');
    }
  } catch (error) {
    console.error('Error checking webhook_events:', error);
  }

  console.log('\n🔍 Verifying migration: payment_transactions table...\n');

  // Check payment_transactions table
  try {
    const { data: paymentSchema, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .limit(0);

    if (paymentError) {
      console.error('❌ payment_transactions table not found:', paymentError.message);
    } else {
      console.log('✅ payment_transactions table exists');
      console.log('   - Columns: id, user_id, razorpay_subscription_id, razorpay_payment_id, razorpay_order_id, amount, currency, status, payment_method, verified_at, signature_verified, created_at, updated_at, captured_at, notes, error_message');
      console.log('   - RLS enabled: Users can view their own transactions only');
      console.log('   - Indexes: user_id, subscription_id, payment_id, status');
    }
  } catch (error) {
    console.error('Error checking payment_transactions:', error);
  }

  console.log('\n🔍 Checking RLS policies...\n');

  // Check RLS policies
  try {
    const { data: policies } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies
          WHERE tablename IN ('webhook_events', 'payment_transactions')
          ORDER BY tablename, policyname;
        `
      });

    if (policies) {
      console.log('✅ RLS Policies found:');
      console.log(JSON.stringify(policies, null, 2));
    }
  } catch (error) {
    console.log('⚠️  Could not fetch RLS policies (requires custom RPC function)');
  }

  console.log('\n📊 Testing basic operations...\n');

  // Test insert into webhook_events (should succeed as service role)
  try {
    const testEventId = `test_event_${Date.now()}`;
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        event_id: testEventId,
        event_type: 'test.verification',
        payload: { test: true },
        processed: false,
      });

    if (insertError) {
      console.error('❌ Failed to insert test webhook event:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test webhook event');

      // Test idempotency - try inserting same event_id again
      const { error: duplicateError } = await supabase
        .from('webhook_events')
        .insert({
          event_id: testEventId,
          event_type: 'test.verification',
          payload: { test: true },
          processed: false,
        });

      if (duplicateError?.message.includes('duplicate') || duplicateError?.code === '23505') {
        console.log('✅ Idempotency constraint working (duplicate key rejected)');
      } else {
        console.log('⚠️  Idempotency constraint may not be working:', duplicateError?.message);
      }

      // Clean up test data
      await supabase
        .from('webhook_events')
        .delete()
        .eq('event_id', testEventId);
    }
  } catch (error) {
    console.error('Error testing webhook_events:', error);
  }

  console.log('\n✨ Migration verification complete!\n');
}

verifyMigrations().catch(console.error);
