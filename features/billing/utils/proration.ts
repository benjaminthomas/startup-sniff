/**
 * Proration Utilities
 * Handles calculations for subscription upgrades with prorated pricing
 */

export interface ProrationCalculation {
  daysRemaining: number;
  daysInPeriod: number;
  unusedAmount: number;
  newPlanAmount: number;
  creditAmount: number;
  amountDue: number;
  savings: number;
}

/**
 * Calculate proration for upgrading from monthly to yearly subscription
 * @param currentPeriodEnd - ISO date string of when current period ends
 * @param monthlyPrice - Monthly plan price in paise (e.g., 2900 for ₹29)
 * @param yearlyPrice - Yearly plan price in paise (e.g., 28908 for ₹289.08)
 * @returns Proration calculation details
 */
export function calculateMonthlyToYearlyProration(
  currentPeriodEnd: string,
  monthlyPrice: number,
  yearlyPrice: number
): ProrationCalculation {
  const now = new Date();
  const periodEnd = new Date(currentPeriodEnd);

  // Calculate days remaining in current billing period
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / msPerDay));
  const daysInPeriod = 30; // Standard month

  // Calculate unused amount from current monthly subscription
  // Formula: (days_remaining / days_in_period) * monthly_price
  const unusedAmount = Math.floor((daysRemaining / daysInPeriod) * monthlyPrice);

  // Amount to pay for yearly subscription
  const newPlanAmount = yearlyPrice;

  // Credit from unused monthly subscription
  const creditAmount = unusedAmount;

  // Final amount due (yearly price minus credit)
  const amountDue = Math.max(0, newPlanAmount - creditAmount);

  // Total savings compared to paying monthly for a year
  const monthlyFor12Months = monthlyPrice * 12;
  const savings = monthlyFor12Months - yearlyPrice;

  return {
    daysRemaining,
    daysInPeriod,
    unusedAmount,
    newPlanAmount,
    creditAmount,
    amountDue,
    savings,
  };
}

/**
 * Format amount in paise to rupees for display
 * @param amountInPaise - Amount in paise
 * @returns Formatted string like "₹29.00"
 */
export function formatRupees(amountInPaise: number): string {
  const rupees = amountInPaise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get proration breakdown message for display to user
 */
export function getProrationMessage(proration: ProrationCalculation): string {
  return `
You have ${proration.daysRemaining} days remaining in your monthly subscription.

Credit from unused time: ${formatRupees(proration.creditAmount)}
Yearly subscription cost: ${formatRupees(proration.newPlanAmount)}
─────────────────────────
Amount due today: ${formatRupees(proration.amountDue)}

You'll save ${formatRupees(proration.savings)} compared to monthly billing!
  `.trim();
}
