#!/usr/bin/env node
/**
 * Exchange Reddit authorization code for refresh token
 * Usage: node scripts/exchange-reddit-code.js YOUR_CODE_HERE
 */

const https = require('https');
const { URLSearchParams } = require('url');

// Your Reddit app credentials
const CLIENT_ID = 'kKVHtAwsrm_DViyqer1v7A';
const CLIENT_SECRET = 'U7ksM_XtcxsegtUjOxvxhjKqK3oU9Q';
const REDIRECT_URI = 'http://localhost:8080';
const USER_AGENT = 'StartupSniff/1.0';

const authCode = process.argv[2];

if (!authCode) {
  console.error('❌ Error: Please provide the authorization code');
  console.log('Usage: node scripts/exchange-reddit-code.js YOUR_CODE_HERE');
  console.log('');
  console.log('Get the code from the redirect URL after running generate-reddit-token.js');
  process.exit(1);
}

console.log('🔄 Exchanging authorization code for refresh token...');

// Prepare the token exchange request
const postData = new URLSearchParams({
  grant_type: 'authorization_code',
  code: authCode,
  redirect_uri: REDIRECT_URI
}).toString();

const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const options = {
  hostname: 'www.reddit.com',
  port: 443,
  path: '/api/v1/access_token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Basic ${auth}`,
    'User-Agent': USER_AGENT
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.error) {
        console.error('❌ Reddit API Error:', response.error);
        console.error('Description:', response.error_description);
        process.exit(1);
      }

      if (response.refresh_token) {
        console.log('✅ SUCCESS! Got your Reddit refresh token');
        console.log('='.repeat(60));
        console.log('🔑 REFRESH TOKEN:');
        console.log(response.refresh_token);
        console.log('='.repeat(60));
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Copy the refresh token above');
        console.log('2. Update your .env.local file:');
        console.log(`   REDDIT_REFRESH_TOKEN=${response.refresh_token}`);
        console.log('3. Restart your development server');
        console.log('');
        console.log('🎉 Your Reddit Trend Engine will now work with real data!');
      } else {
        console.error('❌ Unexpected response format:', response);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
  process.exit(1);
});

req.write(postData);
req.end();