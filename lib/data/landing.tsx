import React from "react";
import {
  Lightbulb,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Globe,
  Building2,
  Home,
  FileText,
  Twitter,
  Presentation,
  UserCircle,
  FileDown,
  Link,
  CheckCircle,
} from "lucide-react";
import { FeatureItem, PlanFeature, StatItem } from "@/types/landing";

export const FEATURES: FeatureItem[] = [
  {
    icon: Lightbulb,
    title: "AI Idea Generation",
    description:
      "Generate unique startup ideas based on real market problems and trending discussions from Reddit communities.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Reddit Trend Analysis",
    description:
      "Analyze millions of Reddit posts to identify emerging problems and untapped market opportunities.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Market Validation",
    description:
      "Validate your ideas with AI-powered market research, competitive analysis, and opportunity scoring.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Target,
    title: "Content Generation",
    description:
      "Generate blog posts, social media content, and marketing materials tailored to your startup idea.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Users,
    title: "ICP Analysis",
    description:
      "Identify your ideal customer profile with detailed demographics, pain points, and market size estimates.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Globe,
    title: "Export & Share",
    description:
      "Export your research to PDF, Notion, or share directly with your team and potential investors.",
    gradient: "from-teal-500 to-blue-500",
  },
];

export const PRICING_PLANS: PlanFeature[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceId: "",
    features: [
      "3 AI-generated startup ideas per month",
      "1 market validation per month",
      "3 content generations per month",
      "Basic Reddit trend analysis",
      "Standard content generation",
      "Email support",
    ],
    limits: { ideas: 3, validations: 1, content: 3 },
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: 2900,
    priceId:
      process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID ||
      "plan_RQbJW54uNkoMwA",
    billingCycle: "monthly",
    features: [
      "Unlimited AI-generated startup ideas",
      "Unlimited market validations",
      "Unlimited content generations",
      "Advanced Reddit trend analysis",
      "Premium content generation",
      "Multi-platform trend analysis",
      "Custom brand voice content",
      "Export to PDF/Notion",
      "Advanced analytics dashboard",
      "Priority support",
      "Cancel anytime",
    ],
    limits: { ideas: -1, validations: -1, content: -1 },
    popular: true,
  },
  {
    id: "pro_yearly",
    name: "Pro",
    price: 29000,
    priceId:
      process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID ||
      "plan_RQbJzVfk744fiY",
    billingCycle: "yearly",
    features: [
      "Everything in Pro plan",
      "Save $58/year (2 months free)",
      "Billed annually",
    ],
    limits: { ideas: -1, validations: -1, content: -1 },
    badge: "SAVE 17%",
  },
];

export const STATS: StatItem[] = [
  {
    value: 10000,
    suffix: "+",
    label: "Reddit Posts Analyzed",
  },
  {
    value: 2500,
    suffix: "+",
    label: "Ideas Generated",
  },
  {
    value: 87,
    suffix: "%",
    label: "Validation Accuracy",
  },
];

export const FEATURE_DEMOS = {
  "AI Idea Generation": (
    <div className="space-y-2">
      <div className="bg-white/10 rounded p-2">
        <div className="font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          SaaS for Pet Owners
        </div>
        <div className="text-muted-foreground">Reddit r/dogs • 89% match</div>
      </div>
      <div className="bg-white/10 rounded p-2">
        <div className="font-semibold flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" />
          Remote Work Tools
        </div>
        <div className="text-muted-foreground">Reddit r/remotework • 76% match</div>
      </div>
    </div>
  ),
  "Reddit Trend Analysis": (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>r/entrepreneur</span>
        <span className="text-purple-500">↗ +23%</span>
      </div>
      <div className="flex justify-between">
        <span>r/startups</span>
        <span className="text-purple-500">↗ +15%</span>
      </div>
      <div className="flex justify-between">
        <span>r/SaaS</span>
        <span className="text-muted-foreground">↘ -8%</span>
      </div>
    </div>
  ),
  "Market Validation": (
    <div className="space-y-2">
      <div className="bg-purple-500/20 rounded p-2">
        <div className="font-semibold">Market Score: 87/100</div>
        <div className="text-purple-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          High demand detected
        </div>
      </div>
      <div className="text-xs">Competition: Medium • TAM: $2.3B</div>
    </div>
  ),
  "Content Generation": (
    <div className="space-y-1">
      <div className="font-semibold flex items-center gap-2">
        <FileText className="w-3 h-3 text-primary" />
        Blog Post: "5 Pain Points..."
      </div>
      <div className="font-semibold flex items-center gap-2">
        <Twitter className="w-3 h-3 text-primary" />
        Tweet: "Just discovered..."
      </div>
      <div className="font-semibold flex items-center gap-2">
        <Presentation className="w-3 h-3 text-primary" />
        Landing Page: Hero section
      </div>
    </div>
  ),
  "ICP Analysis": (
    <div className="space-y-1">
      <div className="font-semibold flex items-center gap-2">
        <UserCircle className="w-3 h-3 text-primary" />
        Primary: Tech professionals
      </div>
      <div>Age: 25-40 • Income: $75k+</div>
      <div>Pain: Remote collaboration tools</div>
    </div>
  ),
  "Export & Share": (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="flex items-center gap-2">
          <FileDown className="w-3 h-3 text-primary" />
          PDF Report
        </span>
        <span className="text-primary">Ready</span>
      </div>
      <div className="flex justify-between">
        <span className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-primary" />
          Notion Export
        </span>
        <span className="text-primary">Ready</span>
      </div>
      <div className="flex justify-between">
        <span className="flex items-center gap-2">
          <Link className="w-3 h-3 text-primary" />
          Share Link
        </span>
        <span className="text-primary">Generated</span>
      </div>
    </div>
  ),
};