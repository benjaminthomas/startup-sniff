// Pricing.tsx
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";

/** Types */
export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number; // Full amount (e.g. 2900 for ₹2,900)
  priceId?: string;
  features?: string[];
  limits?: { ideas?: number; validations?: number; content?: number };
  billingCycle?: "monthly" | "yearly";
  popular?: boolean;
  badge?: string;
}

interface PricingProps {
  plans?: Plan[];
  defaultBilling?: "M" | "A";
  currency?: string; // default "INR"
  onPlanSelect?: (plan: Plan) => boolean | void;
}

const formatCurrency = (amount: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

/** Background shift same as before */
const BackgroundShift = ({ shiftKey }: { shiftKey: string }) => (
  <motion.span
    key={shiftKey}
    layoutId="bg-shift"
    className="absolute inset-0 -z-10 rounded-lg bg-red-500"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ type: "spring", stiffness: 200, damping: 20 }}
  />
);

export const Pricing: React.FC<PricingProps> = ({
  plans = [],
  defaultBilling = "M",
  currency = "INR",
  onPlanSelect,
}) => {
  const [billingCycle, setBillingCycle] = useState<"M" | "A">(defaultBilling);

  // If plans include billingCycle fields, show only matching plans
  const displayedPlans = useMemo(() => {
    const hasBillingCycleField = plans.some((p) => !!p.billingCycle);
    if (!hasBillingCycleField) return plans;
    return plans.filter((p) =>
      billingCycle === "M"
        ? p.billingCycle === "monthly"
        : p.billingCycle === "yearly"
    );
  }, [plans, billingCycle]);

  const handleCTAClick = (plan: Plan) => {
    try {
      const handled = onPlanSelect?.(plan);
      if (handled) return;
    } catch (err) {
      // don't crash UI for parent errors
      console.error("onPlanSelect handler threw:", err);
    }

    // Defaults to opening the price link (if any)
    if (plan.priceId) {
      // parent should generally handle payment flow using priceId — leave default fallback quiet
      console.log("Plan clicked, priceId:", plan.priceId);
    } else {
      // fallback: open plan.link if you add it
      window.alert(
        `Selected plan: ${plan.name} — implement onPlanSelect to process payment.`
      );
    }
  };

  const Heading = () => (
    <div className="relative z-10 my-12 flex flex-col items-center justify-center gap-4">
      <div className="flex w-full flex-col items-start justify-center space-y-4 md:items-center">
        <div className="mb-2 inline-block rounded-full bg-red-100 px-2 py-[0.20rem] text-xs font-medium uppercase text-red-500 dark:bg-red-200">
          Pricing
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl dark:text-gray-200">
          Fair pricing, unfair advantage.
        </p>
        <p className="text-md max-w-xl text-gray-700 md:text-center dark:text-gray-300">
          Get started with Acme today and take your business to the next level.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle("M")}
          className={cn(
            `rounded-lg px-4 py-2 text-sm font-medium `,
            billingCycle === "M"
              ? "relative bg-red-500 text-white "
              : "text-gray-700 hover:bg-red-100 dark:text-gray-300 dark:hover:text-black"
          )}
        >
          Monthly
          {billingCycle === "M" && <BackgroundShift shiftKey="monthly" />}
        </button>

        <button
          onClick={() => setBillingCycle("A")}
          className={cn(
            `rounded-lg px-4 py-2 text-sm font-medium `,
            billingCycle === "A"
              ? "relative bg-red-500 text-white "
              : "text-gray-700 hover:bg-red-100 dark:text-gray-300 dark:hover:text-black"
          )}
        >
          Annual
          {billingCycle === "A" && <BackgroundShift shiftKey="annual" />}
        </button>
      </div>
    </div>
  );

  const PricingCards = () => (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:gap-4">
      {displayedPlans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "w-full rounded-xl border-[1px] p-6 text-left dark:border-gray-600",
            plan.popular ? "border-red-500 shadow-lg" : "border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="mb-1 mt-0 text-sm font-medium uppercase text-red-500">
              {plan.name}
            </p>
            {plan.badge && (
              <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                {plan.badge}
              </div>
            )}
          </div>

          <p className="my-0 mb-6 text-sm text-gray-600">{plan.description}</p>

          <div className="mb-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={plan.id + billingCycle}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="my-0 text-3xl font-semibold text-gray-900 dark:text-gray-100"
              >
                <span>{formatCurrency(plan.price, currency)}</span>
                <span className="text-sm font-medium">
                  /{billingCycle === "M" ? "month" : "year"}
                </span>
              </motion.p>
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={() => handleCTAClick(plan)}
              className="mt-8 w-full rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-500/90"
            >
              {plan.price === 0 ? "Get Started (Free)" : "Get Started"}
            </motion.button>
          </div>

          {(plan.features || []).map((feature, idx) => (
            <div key={idx} className="mb-3 flex items-center gap-2">
              <Check className="text-red-500" size={18} />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden py-12 text-black lg:px-2 lg:py-12">
      <Heading />
      <PricingCards />
    </section>
  );
};

export default Pricing;
