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
      '3 content generations per month',
      'Basic Reddit trend analysis',
      'Standard content generation',
      'Email support'
    ],
    limits: {
      ideas: 3,
      validations: 1,
      content: 3,
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
      '50 content generations per month',
      'Advanced Reddit trend analysis',
      'Premium content generation',
      'Export to PDF/Notion',
      'Priority email support'
    ],
    limits: {
      ideas: 25,
      validations: 10,
      content: 50,
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
      'Unlimited content generations',
      'Multi-platform trend analysis',
      'Custom brand voice content',
      'Advanced analytics dashboard',
      'API access',
      'Priority support & consultation calls'
    ],
    limits: {
      ideas: -1, // Unlimited
      validations: -1, // Unlimited
      content: -1, // Unlimited
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

export const CONTENT_TEMPLATES = [
  {
    id: 'product_launch_blog',
    name: 'Product Launch Blog',
    type: 'blog_post',
    description: 'Announce your new product with compelling benefits',
    preview: 'Introducing [Product] - The Future of [Industry] is Here...',
  },
  {
    id: 'startup_story_blog',
    name: 'Startup Story Blog',
    type: 'blog_post', 
    description: 'Share your entrepreneurial journey and lessons learned',
    preview: 'How I Built [Startup] From Zero to [Milestone]...',
  },
  {
    id: 'problem_solution_tweet',
    name: 'Problem-Solution Thread',
    type: 'tweet',
    description: 'Present a problem and your startup as the solution',
    preview: '🧵 Thread: The $100B problem nobody is talking about...',
  },
  {
    id: 'growth_metrics_tweet', 
    name: 'Growth Metrics Thread',
    type: 'tweet',
    description: 'Share your startup growth and key metrics',
    preview: '📈 We hit [milestone] this month! Here\'s what we learned...',
  },
  {
    id: 'welcome_email',
    name: 'Welcome Email Series',
    type: 'email',
    description: 'Onboard new users with value-driven messaging',
    preview: 'Welcome to [Product]! Here\'s how to get started...',
  },
  {
    id: 'feature_announcement_email',
    name: 'Feature Announcement',
    type: 'email', 
    description: 'Announce new features to your user base',
    preview: 'New Feature Alert: [Feature] is now live!',
  },
  {
    id: 'saas_landing_page',
    name: 'SaaS Landing Page',
    type: 'landing_page',
    description: 'Convert visitors with clear value props and social proof',
    preview: '[Product] - The [Category] Tool That [Benefit]',
  },
  {
    id: 'waitlist_landing_page',
    name: 'Waitlist Landing Page', 
    type: 'landing_page',
    description: 'Build pre-launch excitement and capture early users',
    preview: 'Get Early Access to [Product] - Join 1000+ Founders',
  },
  {
    id: 'investor_pitch_blog',
    name: 'Investor Pitch Blog',
    type: 'blog_post',
    description: 'Showcase your vision and traction to potential investors',
    preview: 'Why We\'re Building [Startup]: A Letter to Investors',
  },
  {
    id: 'customer_success_tweet',
    name: 'Customer Success Story',
    type: 'tweet', 
    description: 'Highlight customer wins and social proof',
    preview: '🎉 Customer spotlight: How [Customer] achieved [result]...',
  },
  {
    id: 'pricing_announcement_email',
    name: 'Pricing Announcement',
    type: 'email',
    description: 'Communicate pricing changes with transparency',
    preview: 'Important Update: Changes to Our Pricing Structure',
  },
  {
    id: 'about_us_page',
    name: 'About Us Page',
    type: 'landing_page',
    description: 'Tell your company story and build trust',
    preview: 'About [Company] - Our Mission to [Vision]',
  },
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