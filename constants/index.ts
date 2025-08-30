import type { PricingPlan } from '@/types/global';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    price: 0,
    priceId: '', // Free plan doesn't need a price ID
    features: [
      '3 AI-generated startup ideas per month',
      '1 market validation per month',
      'Basic Reddit trend analysis',
      'Standard content generation',
      'Email support'
    ],
    limits: {
      ideas: 3,
      validations: 1,
    },
  },
  {
    id: 'founder',
    name: 'Founder',
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_FOUNDER_PRICE_ID || 'price_1234567890founder',
    features: [
      '25 AI-generated startup ideas per month',
      '10 market validations per month',
      'Advanced Reddit trend analysis',
      'Premium content generation',
      'Export to PDF/Notion',
      'Priority email support'
    ],
    limits: {
      ideas: 25,
      validations: 10,
    },
    popular: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID || 'price_1234567890growth',
    features: [
      'Unlimited AI-generated startup ideas',
      'Unlimited market validations',
      'Multi-platform trend analysis',
      'Custom brand voice content',
      'Advanced analytics dashboard',
      'API access',
      'Priority support & consultation calls'
    ],
    limits: {
      ideas: -1, // Unlimited
      validations: -1, // Unlimited
    },
  },
];

export const CONTENT_TYPES = [
  { id: 'blog_post', name: 'Blog Post', description: 'SEO-optimized blog content' },
  { id: 'tweet', name: 'Twitter Thread', description: 'Engaging social media content' },
  { id: 'email', name: 'Email Campaign', description: 'Marketing email sequences' },
  { id: 'landing_page', name: 'Landing Page', description: 'Conversion-focused web copy' },
] as const;

export const BRAND_VOICES = [
  { id: 'technical', name: 'Technical', description: 'Data-driven, precise, and detailed' },
  { id: 'growth_hacker', name: 'Growth Hacker', description: 'Experimental, metrics-focused' },
  { id: 'storyteller', name: 'Storyteller', description: 'Narrative-driven, emotional' },
  { id: 'educator', name: 'Educator', description: 'Clear, informative, helpful' },
  { id: 'contrarian', name: 'Contrarian', description: 'Bold, challenging, unique perspective' },
] as const;

export const SUBREDDITS = [
  'entrepreneur',
  'startups',
  'SaaS',
  'technology',
  'business',
  'smallbusiness',
  'digitalnomad',
  'webdev',
  'programming',
  'MachineLearning',
  'artificial',
  'cscareerquestions',
  'freelance',
  'marketing',
  'sales',
  'investing',
  'PersonalFinanceCanada',
  'financialindependence',
  'productivity',
  'sidehustle',
];

export const API_LIMITS = {
  RATE_LIMIT: {
    explorer: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
    founder: { requests: 50, window: 60 * 1000 }, // 50 requests per minute
    growth: { requests: 200, window: 60 * 1000 }, // 200 requests per minute
  },
  OPENAI_TOKEN_LIMITS: {
    explorer: 10000,
    founder: 50000,
    growth: 200000,
  },
};

export const APP_CONFIG = {
  name: 'StartupSniff',
  description: 'AI-powered startup idea discovery and validation platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: 'support@startupsniff.com',
  social: {
    twitter: 'https://twitter.com/startupsniff',
    github: 'https://github.com/startupsniff',
  },
};

export const VALIDATION_SCHEMAS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  IDEA_TITLE_MAX_LENGTH: 100,
  PROBLEM_STATEMENT_MAX_LENGTH: 500,
  CONTENT_TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 10000,
};

export const UI_CONSTANTS = {
  SKELETON_COUNT: 3,
  PAGINATION_SIZE: 10,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200,
};