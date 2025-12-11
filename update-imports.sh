#!/bin/bash

# Script to systematically update import statements across the codebase
# This script processes replacements in a specific order to avoid conflicts

set -e  # Exit on error

echo "Starting import statement updates..."

# Find all .ts and .tsx files, excluding node_modules and .next
FILES=$(find /d/Projects/startup-sniff -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*")

# Counter for tracking changes
TOTAL_FILES=0
CHANGED_FILES=0

# Process each file
for file in $FILES; do
  TOTAL_FILES=$((TOTAL_FILES + 1))
  MODIFIED=0

  # Create a temporary file
  TEMP_FILE="${file}.tmp"

  # Copy original to temp
  cp "$file" "$TEMP_FILE"

  # Pattern 1: @/lib/data/landing → @/constants/marketing/landing
  # (Do this early to avoid conflicts with other @/lib/ replacements)
  sed -i 's|@/lib/data/landing|@/constants/marketing/landing|g' "$TEMP_FILE"

  # Pattern 2: @/lib/email/ → @/services/email/
  sed -i 's|@/lib/email/|@/services/email/|g' "$TEMP_FILE"

  # Pattern 3: @/lib/reddit/ → @/services/reddit/
  sed -i 's|@/lib/reddit/|@/services/reddit/|g' "$TEMP_FILE"

  # Pattern 4: @/lib/services/analytics-tracker → @/services/analytics/tracker
  sed -i 's|@/lib/services/analytics-tracker|@/services/analytics/tracker|g' "$TEMP_FILE"

  # Pattern 5: @/lib/services/opportunity-scorer → @/services/opportunities/scorer
  sed -i 's|@/lib/services/opportunity-scorer|@/services/opportunities/scorer|g' "$TEMP_FILE"

  # Pattern 6: @/lib/services/opportunity-deep-analyzer → @/services/opportunities/analyzer
  sed -i 's|@/lib/services/opportunity-deep-analyzer|@/services/opportunities/analyzer|g' "$TEMP_FILE"

  # Pattern 7: @/lib/services/trend-detector → @/services/trends/detector
  sed -i 's|@/lib/services/trend-detector|@/services/trends/detector|g' "$TEMP_FILE"

  # Pattern 8: @/lib/services/monitoring → @/services/monitoring
  sed -i 's|@/lib/services/monitoring|@/services/monitoring|g' "$TEMP_FILE"

  # Pattern 9: @/lib/services/redis-cache → @/services/cache/redis
  sed -i 's|@/lib/services/redis-cache|@/services/cache/redis|g' "$TEMP_FILE"

  # Pattern 10: @/lib/services/rate-limiter → @/services/rate-limiter
  sed -i 's|@/lib/services/rate-limiter|@/services/rate-limiter|g' "$TEMP_FILE"

  # Pattern 11: @/lib/razorpay → @/services/payments/razorpay
  sed -i 's|@/lib/razorpay|@/services/payments/razorpay|g' "$TEMP_FILE"

  # Pattern 12: @/lib/supabase.server → @/services/supabase/server
  sed -i 's|@/lib/supabase\.server|@/services/supabase/server|g' "$TEMP_FILE"

  # Pattern 13: @/lib/paywall → @/features/billing/utils/paywall
  sed -i 's|@/lib/paywall|@/features/billing/utils/paywall|g' "$TEMP_FILE"

  # Pattern 14: @/lib/proration → @/features/billing/utils/proration
  sed -i 's|@/lib/proration|@/features/billing/utils/proration|g' "$TEMP_FILE"

  # Pattern 15: @/components/features/ → @/features/[feature]/components/
  # This is more complex - need to handle each feature separately
  sed -i 's|@/components/features/analytics/|@/features/analytics/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/billing/|@/features/billing/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/contact/|@/features/contact/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/content/|@/features/content/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/dashboard/|@/features/dashboard/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/email/|@/features/email/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/ideas/|@/features/ideas/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/opportunities/|@/features/opportunities/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/reddit/|@/features/reddit/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/trends/|@/features/trends/components/|g' "$TEMP_FILE"
  sed -i 's|@/components/features/validation/|@/features/validation/components/|g' "$TEMP_FILE"

  # Pattern 16: @/modules/ → @/features/
  # (Do this last to catch any remaining module references)
  sed -i 's|@/modules/|@/features/|g' "$TEMP_FILE"

  # Check if file was modified
  if ! cmp -s "$file" "$TEMP_FILE"; then
    mv "$TEMP_FILE" "$file"
    CHANGED_FILES=$((CHANGED_FILES + 1))
    echo "Updated: $file"
  else
    rm "$TEMP_FILE"
  fi
done

echo ""
echo "Import update complete!"
echo "Total files processed: $TOTAL_FILES"
echo "Files modified: $CHANGED_FILES"
