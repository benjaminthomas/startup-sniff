export interface PlanFeature {
  id: string;
  name: string;
  price: number;
  priceId: string;
  billingCycle?: 'monthly' | 'yearly';
  features: string[];
  limits: {
    ideas: number;
    validations: number;
    content: number;
  };
  popular?: boolean;
  badge?: string;
}

export interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}

export interface StatItem {
  value: number;
  suffix: string;
  label: string;
}