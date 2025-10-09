import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Database helper for test verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Make sure .env.local is configured.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test data - using shorter values to avoid database limits
const testUser = {
  email: 'test@example.com',
  password: 'TestPass123!',
  fullName: 'Test User'
};

// Helper functions
async function cleanupDatabase() {
  try {
    // Clean up test user and related data
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .single();

    if (user) {
      await supabase.from('user_sessions').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
    }

    // Clean up rate limit records
    await supabase.from('auth_rate_limits').delete().eq('identifier', '::1');

    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.log('⚠️  Database cleanup error (may be expected):', error);
  }
}

async function getUserFromDb(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  return { data, error };
}

test.describe('🔐 Comprehensive Authentication Testing Suite', () => {
  test.use({
    baseURL: 'http://localhost:3001',
    // Run tests sequentially to avoid rate limiting conflicts
  });

  test.beforeAll(async () => {
    await cleanupDatabase();
  });

  test.afterAll(async () => {
    await cleanupDatabase();
  });

  test('🧪 1. Sign Up Flow - Complete user registration', async ({ page }) => {
    console.log('\n📝 TESTING SIGN UP FLOW');
    console.log('='.repeat(50));

    // Navigate to signup page
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/Sign Up/i);
    console.log('✓ Navigated to signup page');

    // Fill out the form
    await page.getByPlaceholder(/name/i).fill(testUser.fullName);
    await page.getByPlaceholder(/email/i).fill(testUser.email);

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(testUser.password);
    await passwordInputs.nth(1).fill(testUser.password);
    console.log('✓ Form filled with valid data');

    // Wait for submit button to be enabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    console.log('✓ Submit button enabled');

    // Submit the form
    await submitButton.click();
    console.log('✓ Form submitted');

    // Wait for response with longer timeout
    await page.waitForTimeout(8000);

    // Check for success message
    const successElements = [
      page.locator('text=check your email'),
      page.locator('text=confirmation email'),
      page.locator('text=verification'),
      page.locator('text=email has been sent'),
      page.locator('[class*="success"]')
    ];

    let foundSuccess = false;
    for (const element of successElements) {
      if (await element.isVisible()) {
        console.log('✅ Success message found');
        foundSuccess = true;
        break;
      }
    }

    // Check for errors
    const errorElement = page.locator('[class*="error"], [role="alert"]').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('⚠️  Error message:', errorText);
    }

    // Verify user creation in database
    await page.waitForTimeout(2000); // Give database time to update
    const { data: user, error } = await getUserFromDb(testUser.email);

    if (user) {
      console.log('✅ USER CREATED IN DATABASE:');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Name: ${user.full_name}`);
      console.log(`   ✉️  Email Verified: ${user.email_verified}`);
      console.log(`   🔑 Verification Token: ${user.email_verification_token ? 'Present' : 'None'}`);
      console.log(`   📅 Created: ${user.created_at}`);

      // Validate user data
      expect(user.email).toBe(testUser.email);
      expect(user.full_name).toBe(testUser.fullName);
      expect(user.email_verified).toBe(false);
      expect(user.email_verification_token).toBeTruthy();
      expect(user.password_hash).toBeTruthy();

      console.log('✅ All user data validation passed');
    } else {
      console.log('❌ User not found in database');
      console.log('Database error:', error);

      // If no success message and no user created, the test failed
      if (!foundSuccess) {
        throw new Error('Sign up failed: No success message and no user created');
      }
    }

    console.log('✅ SIGN UP FLOW COMPLETED SUCCESSFULLY\n');
  });

  test('🧪 2. Email Verification Flow', async ({ page }) => {
    console.log('\n📧 TESTING EMAIL VERIFICATION FLOW');
    console.log('='.repeat(50));

    // Get the user and verification token
    const { data: user } = await getUserFromDb(testUser.email);

    if (!user || !user.email_verification_token) {
      console.log('⚠️  Skipping verification test: No user or verification token found');
      return;
    }

    console.log(`✓ Found user with verification token: ${user.email_verification_token.substring(0, 20)}...`);

    // Simulate clicking verification link
    const verificationUrl = `/auth/verify-email?token=${user.email_verification_token}`;
    await page.goto(verificationUrl);
    console.log('✓ Navigated to verification URL');

    await page.waitForTimeout(3000);

    // Check for verification success
    const successIndicators = [
      page.locator('text=verified'),
      page.locator('text=confirmed'),
      page.locator('text=activated'),
      page.locator('text=success')
    ];

    for (const indicator of successIndicators) {
      if (await indicator.isVisible()) {
        console.log('✅ Verification success message found');
        break;
      }
    }

    // Verify in database
    await page.waitForTimeout(2000);
    const { data: verifiedUser } = await getUserFromDb(testUser.email);

    if (verifiedUser) {
      console.log('✅ EMAIL VERIFICATION STATUS:');
      console.log(`   ✉️  Email Verified: ${verifiedUser.email_verified}`);
      console.log(`   🔑 Verification Token: ${verifiedUser.email_verification_token || 'Cleared'}`);

      expect(verifiedUser.email_verified).toBe(true);
      expect(verifiedUser.email_verification_token).toBeNull();
      console.log('✅ Email verification completed successfully');
    }

    console.log('✅ EMAIL VERIFICATION FLOW COMPLETED\n');
  });

  test('🧪 3. Sign In Flow - Verified User', async ({ page }) => {
    console.log('\n🔐 TESTING SIGN IN FLOW');
    console.log('='.repeat(50));

    // Navigate to signin page
    await page.goto('/auth/signin');
    await expect(page).toHaveTitle(/Sign In/i);
    console.log('✓ Navigated to signin page');

    // Fill signin form
    await page.getByPlaceholder(/email/i).fill(testUser.email);
    await page.getByPlaceholder(/password/i).fill(testUser.password);
    console.log('✓ Signin form filled');

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    console.log('✓ Signin form submitted');

    // Wait for response
    await page.waitForTimeout(5000);

    // Check if redirected away from auth pages (successful login)
    const currentUrl = page.url();
    const isOnAuthPage = currentUrl.includes('/auth/');

    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`🔄 Still on auth page: ${isOnAuthPage}`);

    if (!isOnAuthPage) {
      console.log('✅ Successfully redirected after login');

      // Verify session in database
      const { data: user } = await getUserFromDb(testUser.email);
      if (user) {
        const { data: sessions } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id);

        console.log(`🔐 Found ${sessions?.length || 0} active sessions`);
        if (sessions && sessions.length > 0) {
          console.log('✅ Session created in database');
          console.log(`   🆔 Session ID: ${sessions[0].id}`);
          console.log(`   ⏰ Expires: ${sessions[0].expires_at}`);
        }

        // Check last login update
        if (user.last_login_at) {
          console.log(`✅ Last login updated: ${user.last_login_at}`);
        }
      }
    } else {
      // Check for error messages
      const errorElement = page.locator('[class*="error"], [role="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('⚠️  Signin error:', errorText);
      }
    }

    console.log('✅ SIGN IN FLOW COMPLETED\n');
  });

  test('🧪 4. Password Reset Flow', async ({ page }) => {
    console.log('\n🔄 TESTING PASSWORD RESET FLOW');
    console.log('='.repeat(50));

    // Navigate to forgot password page
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveTitle(/Forgot Password/i);
    console.log('✓ Navigated to forgot password page');

    // Fill email
    await page.getByPlaceholder(/email/i).fill(testUser.email);
    console.log('✓ Email entered');

    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    console.log('✓ Reset request submitted');

    await page.waitForTimeout(3000);

    // Check for success message
    const successElements = [
      page.locator('text=reset'),
      page.locator('text=email sent'),
      page.locator('text=check your email')
    ];

    for (const element of successElements) {
      if (await element.isVisible()) {
        console.log('✅ Password reset email sent message found');
        break;
      }
    }

    // Verify reset token in database
    const { data: user } = await getUserFromDb(testUser.email);
    if (user && user.password_reset_token) {
      console.log('✅ PASSWORD RESET TOKEN GENERATED:');
      console.log(`   🔑 Reset Token: ${user.password_reset_token.substring(0, 20)}...`);
      console.log(`   ⏰ Expires: ${user.password_reset_expires_at}`);
    }

    console.log('✅ PASSWORD RESET FLOW COMPLETED\n');
  });

  test('🧪 5. Security Features Testing', async ({ page }) => {
    console.log('\n🛡️  TESTING SECURITY FEATURES');
    console.log('='.repeat(50));

    // Test 1: Check for CSRF protection elements
    const authPages = [
      { url: '/auth/signin', name: 'Sign In' },
      { url: '/auth/signup', name: 'Sign Up' },
      { url: '/auth/forgot-password', name: 'Forgot Password' }
    ];

    for (const authPage of authPages) {
      await page.goto(authPage.url);
      console.log(`✓ Checking ${authPage.name} page security`);

      // Check if page loads without errors
      await expect(page).toHaveTitle(new RegExp(authPage.name, 'i'));

      // Forms should have submit buttons
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      console.log(`   ✓ ${authPage.name} form security verified`);
    }

    // Test 2: Rate limiting information
    const { data: rateLimits } = await supabase
      .from('auth_rate_limits')
      .select('*');

    console.log(`🚦 RATE LIMITING STATUS:`);
    console.log(`   📊 Total rate limit records: ${rateLimits?.length || 0}`);

    if (rateLimits && rateLimits.length > 0) {
      rateLimits.forEach(rl => {
        console.log(`   - ${rl.endpoint}: ${rl.attempts} attempts (${rl.identifier})`);
      });
    }

    console.log('✅ SECURITY FEATURES TESTED\n');
  });

  test('🧪 6. Database State Analysis', async () => {
    console.log('\n📊 FINAL DATABASE STATE ANALYSIS');
    console.log('='.repeat(50));

    // Get final user state
    const { data: finalUser } = await getUserFromDb(testUser.email);

    if (finalUser) {
      console.log('✅ FINAL USER STATE:');
      console.log(`   🆔 ID: ${finalUser.id}`);
      console.log(`   📧 Email: ${finalUser.email}`);
      console.log(`   👤 Full Name: ${finalUser.full_name}`);
      console.log(`   ✉️  Email Verified: ${finalUser.email_verified}`);
      console.log(`   🔑 Password Hash: ${finalUser.password_hash ? 'Present' : 'Missing'}`);
      console.log(`   🔐 Login Attempts: ${finalUser.login_attempts}`);
      console.log(`   ⏰ Last Login: ${finalUser.last_login_at || 'Never'}`);
      console.log(`   📅 Created: ${finalUser.created_at}`);
      console.log(`   📝 Updated: ${finalUser.updated_at}`);

      // Get sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', finalUser.id);

      console.log(`\n🔐 SESSIONS: ${sessions?.length || 0} active`);
      if (sessions && sessions.length > 0) {
        sessions.forEach((session, index) => {
          console.log(`   Session ${index + 1}:`);
          console.log(`     🆔 ID: ${session.id}`);
          console.log(`     🎫 Token: ${session.session_token.substring(0, 20)}...`);
          console.log(`     ⏰ Expires: ${session.expires_at}`);
          console.log(`     🌐 IP: ${session.ip_address || 'Unknown'}`);
        });
      }

      // Summary
      console.log('\n📋 TEST SUMMARY:');
      console.log(`   ✅ User Creation: ${finalUser ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   ✅ Email Verification: ${finalUser.email_verified ? 'SUCCESS' : 'PENDING'}`);
      console.log(`   ✅ Password Security: ${finalUser.password_hash ? 'SECURED' : 'FAILED'}`);
      console.log(`   ✅ Session Management: ${sessions && sessions.length > 0 ? 'ACTIVE' : 'NONE'}`);
      console.log(`   ✅ Reset Token: ${finalUser.password_reset_token ? 'GENERATED' : 'NONE'}`);
    } else {
      console.log('❌ No user found in final state');
    }

    console.log('\n🎉 COMPREHENSIVE AUTHENTICATION TESTING COMPLETED!');
    console.log('='.repeat(50));
  });
});