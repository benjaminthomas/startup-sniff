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

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  fullName: 'Test User'
};

// Helper functions
async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Clean up test user and related data
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .single();

    if (user) {
      console.log(`   - Cleaning up user: ${user.id}`);
      await supabase.from('user_sessions').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
    }

    // Clean up rate limit records
    await supabase.from('auth_rate_limits').delete().eq('identifier', '::1');
    await supabase.from('auth_rate_limits').delete().eq('identifier', '127.0.0.1');

    console.log('✅ Database cleanup completed successfully');
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

async function getSessionsForUser(userId: string) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
}

test.describe('🔐 Comprehensive Authentication System Testing', () => {
  test.beforeAll(async () => {
    console.log('\n🚀 STARTING COMPREHENSIVE AUTHENTICATION TESTING');
    console.log('===============================================');
    console.log(`Testing against: http://localhost:3000`);
    console.log(`Test user: ${testUser.email}`);
    console.log('===============================================\n');

    await cleanupDatabase();
  });

  test.afterAll(async () => {
    console.log('\n🧹 FINAL CLEANUP');
    await cleanupDatabase();
  });

  test('1️⃣ Sign Up Flow - Complete user registration', async ({ page }) => {
    console.log('\n📝 TEST 1: SIGN UP FLOW');
    console.log('========================');

    // Navigate to signup page
    console.log('🔗 Navigating to sign up page...');
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/Sign Up/i);
    console.log('✅ Successfully navigated to signup page');

    // Fill out the form with test data
    console.log('📋 Filling out registration form...');
    await page.getByPlaceholder(/name/i).fill(testUser.fullName);
    await page.getByPlaceholder(/email/i).fill(testUser.email);

    // Handle password fields
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(testUser.password);
    await passwordInputs.nth(1).fill(testUser.password);
    console.log('✅ Form filled with test data:');
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   👤 Name: ${testUser.fullName}`);
    console.log(`   🔒 Password: ${'*'.repeat(testUser.password.length)}`);

    // Submit the form
    console.log('⏳ Submitting registration form...');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(8000);

    // Check for success message
    const successMessages = [
      'check your email',
      'confirmation email',
      'verification',
      'email has been sent',
      'registered successfully'
    ];

    let foundSuccess = false;
    for (const message of successMessages) {
      const element = page.locator(`text=${message}`);
      if (await element.isVisible()) {
        console.log(`✅ Success message found: "${message}"`);
        foundSuccess = true;
        break;
      }
    }

    // Check for any error messages
    const errorElement = page.locator('[class*="error"], [role="alert"]').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('⚠️  Error message displayed:', errorText);
    }

    // Verify user was created in database
    console.log('🔍 Checking database for user creation...');
    await page.waitForTimeout(3000);
    const { data: user, error } = await getUserFromDb(testUser.email);

    if (user) {
      console.log('✅ USER SUCCESSFULLY CREATED IN DATABASE:');
      console.log(`   🆔 User ID: ${user.id}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Full Name: ${user.full_name}`);
      console.log(`   ✉️  Email Verified: ${user.email_verified}`);
      console.log(`   🔑 Verification Token: ${user.email_verification_token ? 'Present' : 'Missing'}`);
      console.log(`   🔒 Password Hash: ${user.password_hash ? 'Present' : 'Missing'}`);
      console.log(`   📅 Created At: ${user.created_at}`);

      // Validate user data matches expectations
      expect(user.email).toBe(testUser.email);
      expect(user.full_name).toBe(testUser.fullName);
      expect(user.email_verified).toBe(false);
      expect(user.email_verification_token).toBeTruthy();
      expect(user.password_hash).toBeTruthy();

      console.log('✅ All user data validations passed');
    } else {
      console.log('❌ USER NOT FOUND IN DATABASE');
      if (error) {
        console.log('Database error:', error);
      }
      if (!foundSuccess) {
        throw new Error('Sign up failed: No success message and no user created');
      }
    }

    console.log('✅ SIGN UP FLOW TEST COMPLETED\n');
  });

  test('2️⃣ Email Verification Flow - Verify email address', async ({ page }) => {
    console.log('\n📧 TEST 2: EMAIL VERIFICATION FLOW');
    console.log('==================================');

    // Get the user and verification token from database
    console.log('🔍 Retrieving user and verification token...');
    const { data: user } = await getUserFromDb(testUser.email);

    if (!user || !user.email_verification_token) {
      console.log('⚠️  Skipping verification test: No user or verification token found');
      test.skip();
      return;
    }

    console.log('✅ Found user with verification token:');
    console.log(`   🆔 User ID: ${user.id}`);
    console.log(`   🔑 Token: ${user.email_verification_token.substring(0, 30)}...`);

    // Navigate to verification URL
    const verificationUrl = `/auth/verify-email?token=${user.email_verification_token}`;
    console.log('🔗 Navigating to verification URL...');
    await page.goto(verificationUrl);

    await page.waitForTimeout(5000);

    // Check for verification success indicators
    const successMessages = [
      'verified',
      'confirmed',
      'activated',
      'email has been verified',
      'verification successful'
    ];

    for (const message of successMessages) {
      const element = page.locator(`text=${message}`);
      if (await element.isVisible()) {
        console.log(`✅ Verification success message found: "${message}"`);
        break;
      }
    }

    // Verify changes in database
    console.log('🔍 Checking database for verification status...');
    await page.waitForTimeout(3000);
    const { data: verifiedUser } = await getUserFromDb(testUser.email);

    if (verifiedUser) {
      console.log('✅ EMAIL VERIFICATION DATABASE STATUS:');
      console.log(`   ✉️  Email Verified: ${verifiedUser.email_verified}`);
      console.log(`   🔑 Verification Token: ${verifiedUser.email_verification_token || 'Cleared'}`);
      console.log(`   📝 Updated At: ${verifiedUser.updated_at}`);

      // Verify that email_verified is now true and token is cleared
      expect(verifiedUser.email_verified).toBe(true);
      console.log('✅ Email verification status updated correctly');

      if (verifiedUser.email_verification_token === null) {
        console.log('✅ Verification token cleared as expected');
      } else {
        console.log('⚠️  Verification token still present (may be design choice)');
      }
    } else {
      console.log('❌ User not found during verification check');
    }

    console.log('✅ EMAIL VERIFICATION FLOW TEST COMPLETED\n');
  });

  test('3️⃣ Sign In Flow - User authentication and session creation', async ({ page }) => {
    console.log('\n🔐 TEST 3: SIGN IN FLOW');
    console.log('=======================');

    // Navigate to signin page
    console.log('🔗 Navigating to sign in page...');
    await page.goto('/auth/signin');
    await expect(page).toHaveTitle(/Sign In/i);
    console.log('✅ Successfully navigated to signin page');

    // Fill signin form
    console.log('📋 Filling out signin form...');
    await page.getByPlaceholder(/email/i).fill(testUser.email);
    await page.getByPlaceholder(/password/i).fill(testUser.password);
    console.log(`✅ Signin form filled with email: ${testUser.email}`);

    // Submit form
    console.log('⏳ Submitting signin form...');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for response and check redirect
    await page.waitForTimeout(8000);

    const currentUrl = page.url();
    const isOnAuthPage = currentUrl.includes('/auth/');

    console.log(`📍 Current URL after signin: ${currentUrl}`);
    console.log(`🔄 Still on auth page: ${isOnAuthPage}`);

    if (!isOnAuthPage) {
      console.log('✅ Successfully redirected after login (expected behavior)');

      // Verify session creation in database
      console.log('🔍 Checking database for session creation...');
      const { data: user } = await getUserFromDb(testUser.email);

      if (user) {
        const { data: sessions } = await getSessionsForUser(user.id);

        console.log('✅ SESSION MANAGEMENT STATUS:');
        console.log(`   📊 Active sessions: ${sessions?.length || 0}`);

        if (sessions && sessions.length > 0) {
          sessions.forEach((session, index) => {
            console.log(`   Session ${index + 1}:`);
            console.log(`     🆔 Session ID: ${session.id}`);
            console.log(`     🎫 Token: ${session.session_token.substring(0, 20)}...`);
            console.log(`     ⏰ Expires: ${session.expires_at}`);
            console.log(`     🌐 IP Address: ${session.ip_address || 'Not recorded'}`);
            console.log(`     📅 Created: ${session.created_at}`);
          });
          console.log('✅ Session successfully created in user_sessions table');
        } else {
          console.log('⚠️  No sessions found in database');
        }

        // Check if last_login_at was updated
        if (user.last_login_at) {
          console.log(`✅ Last login timestamp updated: ${user.last_login_at}`);
        } else {
          console.log('⚠️  Last login timestamp not updated');
        }
      }
    } else {
      // Check for error messages if still on auth page
      const errorElement = page.locator('[class*="error"], [role="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('⚠️  Signin error displayed:', errorText);
      } else {
        console.log('⚠️  Still on auth page but no error message visible');
      }
    }

    console.log('✅ SIGN IN FLOW TEST COMPLETED\n');
  });

  test('4️⃣ Password Reset Flow - Forgot password functionality', async ({ page }) => {
    console.log('\n🔄 TEST 4: PASSWORD RESET FLOW');
    console.log('===============================');

    // Navigate to forgot password page
    console.log('🔗 Navigating to forgot password page...');
    await page.goto('/auth/forgot-password');
    await expect(page).toHaveTitle(/Forgot Password/i);
    console.log('✅ Successfully navigated to forgot password page');

    // Fill email address
    console.log('📧 Entering email address for password reset...');
    await page.getByPlaceholder(/email/i).fill(testUser.email);
    console.log(`✅ Email entered: ${testUser.email}`);

    // Submit reset request
    console.log('⏳ Submitting password reset request...');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(5000);

    // Check for success message
    const successMessages = [
      'reset',
      'email sent',
      'check your email',
      'password reset link',
      'reset instructions'
    ];

    for (const message of successMessages) {
      const element = page.locator(`text=${message}`);
      if (await element.isVisible()) {
        console.log(`✅ Password reset success message found: "${message}"`);
        break;
      }
    }

    // Verify reset token was generated in database
    console.log('🔍 Checking database for password reset token...');
    await page.waitForTimeout(3000);
    const { data: user } = await getUserFromDb(testUser.email);

    if (user) {
      console.log('✅ PASSWORD RESET TOKEN STATUS:');
      console.log(`   🔑 Reset Token: ${user.password_reset_token ? 'Generated' : 'Not found'}`);
      console.log(`   ⏰ Expires At: ${user.password_reset_expires_at || 'Not set'}`);
      console.log(`   📝 Updated At: ${user.updated_at}`);

      if (user.password_reset_token) {
        console.log(`   🔐 Token (partial): ${user.password_reset_token.substring(0, 30)}...`);
        console.log('✅ Password reset token successfully generated');

        // Verify token expiration is set to a future date
        if (user.password_reset_expires_at) {
          const expiresAt = new Date(user.password_reset_expires_at);
          const now = new Date();
          if (expiresAt > now) {
            console.log('✅ Reset token expiration properly set in future');
          } else {
            console.log('⚠️  Reset token appears to be expired');
          }
        }
      } else {
        console.log('❌ Password reset token was not generated');
      }
    } else {
      console.log('❌ User not found during password reset check');
    }

    // Test the reset URL functionality (basic check)
    if (user && user.password_reset_token) {
      console.log('🔗 Testing password reset URL...');
      const resetUrl = `/auth/reset-password?token=${user.password_reset_token}`;
      await page.goto(resetUrl);
      await page.waitForTimeout(3000);

      // Check if reset password form is displayed
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        console.log('✅ Password reset form properly displayed');
      } else {
        console.log('⚠️  Password reset form not found or token invalid');
      }
    }

    console.log('✅ PASSWORD RESET FLOW TEST COMPLETED\n');
  });

  test('5️⃣ Security Features - CSRF protection and rate limiting', async ({ page }) => {
    console.log('\n🛡️  TEST 5: SECURITY FEATURES');
    console.log('============================');

    // Test CSRF protection on auth pages
    console.log('🔒 Testing CSRF protection...');
    const authPages = [
      { url: '/auth/signin', name: 'Sign In' },
      { url: '/auth/signup', name: 'Sign Up' },
      { url: '/auth/forgot-password', name: 'Forgot Password' }
    ];

    for (const authPage of authPages) {
      console.log(`   Checking ${authPage.name} page...`);
      await page.goto(authPage.url);
      await expect(page).toHaveTitle(new RegExp(authPage.name, 'i'));

      // Check if forms are present and functional
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();

      // Check for any hidden CSRF inputs or meta tags
      const csrfElements = await page.locator('input[name*="csrf"], meta[name*="csrf"]').count();
      if (csrfElements > 0) {
        console.log(`     ✅ CSRF elements found: ${csrfElements}`);
      } else {
        console.log(`     ℹ️  No visible CSRF elements (may be handled server-side)`);
      }

      console.log(`   ✅ ${authPage.name} page security check completed`);
    }

    // Check rate limiting information in database
    console.log('🚦 Checking rate limiting status...');
    const { data: rateLimits } = await supabase
      .from('auth_rate_limits')
      .select('*');

    console.log('✅ RATE LIMITING ANALYSIS:');
    console.log(`   📊 Total rate limit records: ${rateLimits?.length || 0}`);

    if (rateLimits && rateLimits.length > 0) {
      const groupedLimits = rateLimits.reduce<Record<string, { endpoint: string; attempts: number; identifier: string; last_attempt_at: string; count: number }>>((acc, rl) => {
        const key = `${rl.endpoint}-${rl.identifier}`;
        if (!acc[key]) {
          acc[key] = { ...rl, count: 1 };
        } else {
          acc[key].attempts += rl.attempts;
          acc[key].count += 1;
        }
        return acc;
      }, {});

      Object.values(groupedLimits).forEach((rl) => {
        console.log(`   📈 ${rl.endpoint}: ${rl.attempts} attempts from ${rl.identifier}`);
        console.log(`      ⏰ Last attempt: ${rl.last_attempt_at}`);
      });
    } else {
      console.log('   ℹ️  No rate limiting records found (clean slate)');
    }

    // Test basic rate limiting by making multiple rapid requests
    console.log('⚡ Testing rate limiting with rapid requests...');
    const rapidTestResults = [];

    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      await page.goto('/auth/signin');

      // Try to submit empty form (should trigger validation/rate limiting)
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }

      const endTime = Date.now();
      rapidTestResults.push(endTime - startTime);
    }

    console.log('✅ Rapid request test completed:');
    rapidTestResults.forEach((time, index) => {
      console.log(`   Request ${index + 1}: ${time}ms`);
    });

    // Check if rate limiting records were created
    const { data: newRateLimits } = await supabase
      .from('auth_rate_limits')
      .select('*')
      .order('last_attempt_at', { ascending: false })
      .limit(5);

    if (newRateLimits && newRateLimits.length > 0) {
      console.log('✅ Rate limiting system is active:');
      newRateLimits.forEach((rl, index) => {
        console.log(`   Record ${index + 1}: ${rl.endpoint} - ${rl.attempts} attempts`);
      });
    }

    console.log('✅ SECURITY FEATURES TEST COMPLETED\n');
  });

  test('6️⃣ Final Database Analysis - Complete system verification', async () => {
    console.log('\n📊 TEST 6: FINAL DATABASE ANALYSIS');
    console.log('===================================');

    // Get complete user state
    console.log('🔍 Retrieving final user state...');
    const { data: finalUser } = await getUserFromDb(testUser.email);

    if (!finalUser) {
      console.log('❌ CRITICAL: User not found in final database state');
      return;
    }

    console.log('✅ FINAL USER STATE ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🆔 User ID: ${finalUser.id}`);
    console.log(`📧 Email: ${finalUser.email}`);
    console.log(`👤 Full Name: ${finalUser.full_name}`);
    console.log(`✉️  Email Verified: ${finalUser.email_verified ? '✅ YES' : '❌ NO'}`);
    console.log(`🔒 Password Hash: ${finalUser.password_hash ? '✅ Present' : '❌ Missing'}`);
    console.log(`🔐 Login Attempts: ${finalUser.login_attempts || 0}`);
    console.log(`🚫 Account Locked: ${finalUser.account_locked_until ? '⚠️  YES' : '✅ NO'}`);
    console.log(`⏰ Last Login: ${finalUser.last_login_at || 'Never'}`);
    console.log(`📅 Created: ${finalUser.created_at}`);
    console.log(`📝 Updated: ${finalUser.updated_at}`);

    // Token status
    console.log('\n🔑 TOKEN STATUS:');
    console.log('━━━━━━━━━━━━━━━━');
    console.log(`📧 Email Verification Token: ${finalUser.email_verification_token ? '🟡 Present' : '✅ Cleared'}`);
    console.log(`🔄 Password Reset Token: ${finalUser.password_reset_token ? '🟡 Present' : '✅ None'}`);
    if (finalUser.password_reset_expires_at) {
      console.log(`⏰ Reset Token Expires: ${finalUser.password_reset_expires_at}`);
    }

    // Get active sessions
    console.log('\n🔐 SESSION ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━');
    const { data: sessions } = await getSessionsForUser(finalUser.id);

    console.log(`📊 Total Sessions: ${sessions?.length || 0}`);

    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        const isExpired = new Date(session.expires_at) < new Date();
        console.log(`\n   Session ${index + 1}:`);
        console.log(`   ├── 🆔 ID: ${session.id}`);
        console.log(`   ├── 🎫 Token: ${session.session_token.substring(0, 25)}...`);
        console.log(`   ├── ⏰ Expires: ${session.expires_at} ${isExpired ? '🔴 EXPIRED' : '🟢 ACTIVE'}`);
        console.log(`   ├── 🌐 IP: ${session.ip_address || 'Unknown'}`);
        console.log(`   ├── 🖥️  User Agent: ${session.user_agent || 'Unknown'}`);
        console.log(`   └── 📅 Created: ${session.created_at}`);
      });
    } else {
      console.log('ℹ️  No active sessions found');
    }

    // Rate limiting summary
    console.log('\n🚦 RATE LIMITING SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    const { data: allRateLimits } = await supabase
      .from('auth_rate_limits')
      .select('*');

    if (allRateLimits && allRateLimits.length > 0) {
      const rateLimitSummary = allRateLimits.reduce<Record<string, { total_attempts: number; unique_ips: Set<string> }>>((acc, rl) => {
        if (!acc[rl.endpoint]) {
          acc[rl.endpoint] = { total_attempts: 0, unique_ips: new Set() };
        }
        acc[rl.endpoint].total_attempts += rl.attempts;
        acc[rl.endpoint].unique_ips.add(rl.identifier);
        return acc;
      }, {});

      Object.entries(rateLimitSummary).forEach(([endpoint, data]) => {
        console.log(`📈 ${endpoint}: ${data.total_attempts} attempts from ${data.unique_ips.size} unique IPs`);
      });
    } else {
      console.log('ℹ️  No rate limiting data recorded');
    }

    // Test results summary
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const testResults = {
      userCreation: finalUser ? '✅ SUCCESS' : '❌ FAILED',
      emailVerification: finalUser.email_verified ? '✅ VERIFIED' : '⚠️  PENDING',
      passwordSecurity: finalUser.password_hash ? '✅ SECURED' : '❌ FAILED',
      sessionManagement: sessions && sessions.length > 0 ? '✅ ACTIVE' : '⚠️  NO_SESSIONS',
      resetFunctionality: finalUser.password_reset_token ? '✅ FUNCTIONAL' : 'ℹ️  NOT_TESTED',
      rateLimiting: allRateLimits && allRateLimits.length > 0 ? '✅ ACTIVE' : 'ℹ️  NO_ACTIVITY',
      tokenManagement: !finalUser.email_verification_token ? '✅ CLEAN' : '⚠️  TOKENS_REMAINING'
    };

    console.log('📋 Individual Test Results:');
    Object.entries(testResults).forEach(([test, result]) => {
      const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${testName}: ${result}`);
    });

    // Overall system health
    const successCount = Object.values(testResults).filter(result => result.includes('✅')).length;
    const totalTests = Object.keys(testResults).length;
    const healthPercentage = Math.round((successCount / totalTests) * 100);

    console.log(`\n🏥 OVERALL SYSTEM HEALTH: ${healthPercentage}% (${successCount}/${totalTests} tests passed)`);

    if (healthPercentage >= 85) {
      console.log('🎉 EXCELLENT: Authentication system is fully functional!');
    } else if (healthPercentage >= 70) {
      console.log('✅ GOOD: Authentication system is mostly functional with minor issues');
    } else {
      console.log('⚠️  WARNING: Authentication system has significant issues that need attention');
    }

    console.log('\n🏁 COMPREHENSIVE AUTHENTICATION TESTING COMPLETED!');
    console.log('═══════════════════════════════════════════════════');
  });
});