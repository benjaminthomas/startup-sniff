#!/bin/bash

# Test script for Reddit Fetch API endpoint
# Usage: ./scripts/test-fetch-api.sh

echo "🧪 Testing Reddit Fetch API Endpoint"
echo "======================================"
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if dev server is running
echo "📡 Checking if dev server is running at http://localhost:3000..."
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Dev server not running. Please start it with: npm run dev"
  exit 1
fi
echo "✅ Dev server is running"
echo ""

# Test GET endpoint (health check)
echo "1️⃣  Testing GET /api/reddit/fetch (health check)..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/reddit/fetch)
echo "$HEALTH_RESPONSE" | jq '.'
echo ""

# Test POST endpoint with authentication
echo "2️⃣  Testing POST /api/reddit/fetch (data collection)..."
echo "   Using API_SECRET: ${API_SECRET:0:10}..."
echo "   This will fetch from high-priority subreddits (may take 10-20 seconds)..."
echo ""

COLLECTION_RESPONSE=$(curl -s -X POST \
  http://localhost:3000/api/reddit/fetch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_SECRET" \
  -d '{
    "mode": "high-priority",
    "limit": 5
  }')

echo "$COLLECTION_RESPONSE" | jq '.'
echo ""

# Parse and display summary
SUCCESS=$(echo "$COLLECTION_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  FETCHED=$(echo "$COLLECTION_RESPONSE" | jq -r '.posts.fetched')
  INSERTED=$(echo "$COLLECTION_RESPONSE" | jq -r '.posts.inserted')
  DURATION=$(echo "$COLLECTION_RESPONSE" | jq -r '.duration')

  echo "✅ Collection successful!"
  echo "   - Duration: $DURATION"
  echo "   - Posts fetched: $FETCHED"
  echo "   - Posts inserted: $INSERTED"
  echo ""

  # Query database to verify
  echo "3️⃣  Verifying posts in database..."
  echo "   (This requires Supabase CLI or manual check)"
  echo ""
  echo "   To verify manually, run:"
  echo "   SELECT COUNT(*) FROM reddit_posts WHERE created_at > NOW() - INTERVAL '5 minutes';"
else
  ERROR=$(echo "$COLLECTION_RESPONSE" | jq -r '.error')
  echo "❌ Collection failed: $ERROR"
fi

echo ""
echo "✅ Test complete!"
