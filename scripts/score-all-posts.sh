#!/bin/bash

# Score all remaining posts in batches
# This script runs the scoring endpoint multiple times until all posts are scored

API_URL="http://localhost:3001/api/reddit/score"
API_SECRET="dev_api_secret_change_in_production_12345"
BATCH_SIZE=200

echo "🎯 Scoring All Reddit Posts"
echo "============================="
echo ""

# Loop until no more unscored posts
ITERATION=1
while true; do
  echo "📊 Batch $ITERATION: Scoring up to $BATCH_SIZE posts..."

  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_SECRET" \
    -d "{\"limit\": $BATCH_SIZE, \"minScore\": 0}")

  # Extract stats
  SCORED=$(echo "$RESPONSE" | grep -o '"scored":[0-9]*' | grep -o '[0-9]*')
  UPDATED=$(echo "$RESPONSE" | grep -o '"updated":[0-9]*' | grep -o '[0-9]*')
  SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[a-z]*' | grep -o '[a-z]*')

  echo "   ✅ Scored: $SCORED | Updated: $UPDATED"

  # Break if no posts were scored or if request failed
  if [ "$SCORED" == "0" ] || [ "$SUCCESS" == "false" ]; then
    echo ""
    echo "✅ All posts scored!"
    break
  fi

  ITERATION=$((ITERATION + 1))
  echo ""
  sleep 1  # Small delay between batches
done

echo ""
echo "📈 Final Statistics:"
curl -s "$API_URL" | python3 -m json.tool
