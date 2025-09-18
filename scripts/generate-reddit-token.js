#!/usr/bin/env node
/**
 * Reddit OAuth2 Refresh Token Generator
 * Run this once to get your Reddit refresh token
 */

const https = require('https');
const { URLSearchParams } = require('url');
const { execSync } = require('child_process');

// Your Reddit app credentials
const CLIENT_ID = 'kKVHtAwsrm_DViyqer1v7A';
const CLIENT_SECRET = 'U7ksM_XtcxsegtUjOxvxhjKqK3oU9Q';
const REDIRECT_URI = 'http://localhost:8080';
const USER_AGENT = 'StartupSniff/1.0';

// Required scopes for trend analysis
const SCOPES = ['read', 'history'];

console.log('🚀 Reddit OAuth2 Token Generator for StartupSniff');
console.log('='.repeat(50));

// Step 1: Generate authorization URL
const authParams = new URLSearchParams({
  client_id: CLIENT_ID,
  response_type: 'code',
  state: 'random_state_string',
  redirect_uri: REDIRECT_URI,
  duration: 'permanent',
  scope: SCOPES.join(' ')
});

const authUrl = `https://www.reddit.com/api/v1/authorize?${authParams.toString()}`;

console.log('📋 STEP 1: Authorize the application');
console.log('Click this link to authorize StartupSniff to access Reddit:');
console.log('');
console.log(`🔗 ${authUrl}`);
console.log('');

// Try to open the URL automatically
try {
  const platform = process.platform;
  if (platform === 'darwin') {
    execSync(`open "${authUrl}"`);
  } else if (platform === 'linux') {
    execSync(`xdg-open "${authUrl}"`);
  } else if (platform === 'win32') {
    execSync(`start "${authUrl}"`);
  }
  console.log('✅ Browser should open automatically');
} catch (error) {
  console.log('⚠️  Please copy and paste the URL above into your browser');
}

console.log('');
console.log('📋 STEP 2: After authorization');
console.log('1. You will be redirected to: http://localhost:8080/?code=XXXXX&state=random_state_string');
console.log('2. Copy the "code" parameter from the URL');
console.log('3. Run: node scripts/exchange-reddit-code.js YOUR_CODE_HERE');
console.log('');
console.log('🔄 The authorization code is valid for 10 minutes');