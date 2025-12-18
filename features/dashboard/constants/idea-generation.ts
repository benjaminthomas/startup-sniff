import {
  Monitor,
  Heart,
  DollarSign,
  GraduationCap,
  ShoppingCart,
  Leaf,
  Film,
  Car,
  Bolt,
  MessageSquare,
  Globe,
  CreditCard,
  Home,
  BookOpen,
  HandHeart,
  Rocket,
  Store,
  Briefcase,
  Keyboard,
  Laptop,
  Baby,
  UserX,
  Banknote,
  Building,
  Hammer,
  Target,
  Lightbulb,
  Users,
  Brain,
  type LucideIcon
} from 'lucide-react';

export interface IndustryOption {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface ProblemAreaOption {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface AudienceOption {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface BudgetOption {
  id: string;
  label: string;
  amount: string;
  icon: LucideIcon;
  description: string;
}

export interface TimelineOption {
  id: string;
  label: string;
  period: string;
  icon: LucideIcon;
  description: string;
}

export interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  optional: boolean;
  required: boolean;
}

export const industries: IndustryOption[] = [
  { id: 'technology', label: 'Technology', icon: Monitor, description: 'Software, AI, hardware' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, description: 'Medical, wellness, biotech' },
  { id: 'finance', label: 'Finance', icon: DollarSign, description: 'Fintech, banking, payments' },
  { id: 'education', label: 'Education', icon: GraduationCap, description: 'EdTech, learning, training' },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart, description: 'Online retail, marketplaces' },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf, description: 'Green tech, climate solutions' },
  { id: 'entertainment', label: 'Entertainment', icon: Film, description: 'Media, gaming, content' },
  { id: 'transportation', label: 'Transportation', icon: Car, description: 'Mobility, logistics, delivery' },
];

export const problemAreas: ProblemAreaOption[] = [
  { id: 'productivity', label: 'Productivity', icon: Bolt, description: 'Getting things done better' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, description: 'Better connections' },
  { id: 'health', label: 'Health & Wellness', icon: Heart, description: 'Physical and mental health' },
  { id: 'environment', label: 'Environment', icon: Globe, description: 'Sustainability and climate' },
  { id: 'finance', label: 'Personal Finance', icon: CreditCard, description: 'Money management' },
  { id: 'remote-work', label: 'Remote Work', icon: Home, description: 'Distributed teams' },
  { id: 'education', label: 'Learning', icon: BookOpen, description: 'Skill development' },
  { id: 'social-impact', label: 'Social Impact', icon: HandHeart, description: 'Making a difference' },
];

export const audiences: AudienceOption[] = [
  { id: 'entrepreneurs', label: 'Entrepreneurs', icon: Rocket, description: 'Business builders' },
  { id: 'small-business', label: 'Small Businesses', icon: Store, description: 'Local businesses' },
  { id: 'professionals', label: 'Professionals', icon: Briefcase, description: 'Working adults' },
  { id: 'students', label: 'Students', icon: GraduationCap, description: 'Learners of all ages' },
  { id: 'developers', label: 'Developers', icon: Keyboard, description: 'Tech professionals' },
  { id: 'remote-workers', label: 'Remote Workers', icon: Laptop, description: 'Digital nomads' },
  { id: 'parents', label: 'Parents', icon: Baby, description: 'Families with children' },
  { id: 'seniors', label: 'Seniors', icon: UserX, description: '65+ demographic' },
];

export const budgetOptions: BudgetOption[] = [
  { id: 'low', label: 'Bootstrap', amount: '$0 - $10K', icon: Banknote, description: 'Start lean and scrappy' },
  { id: 'medium', label: 'Funded', amount: '$10K - $100K', icon: CreditCard, description: 'Moderate investment' },
  { id: 'high', label: 'Well-funded', amount: '$100K+', icon: Building, description: 'Strong financial backing' }
];

export const timelineOptions: TimelineOption[] = [
  { id: 'short', label: 'Quick Launch', period: '0-6 months', icon: Bolt, description: 'Fast to market' },
  { id: 'medium', label: 'Steady Build', period: '6-18 months', icon: Rocket, description: 'Balanced approach' },
  { id: 'long', label: 'Long-term', period: '18+ months', icon: Hammer, description: 'Complex solutions' }
];

export const steps: StepConfig[] = [
  {
    id: 'industry',
    title: 'Choose Your Industry',
    subtitle: 'What market interests you most?',
    icon: Target,
    optional: false,
    required: true
  },
  {
    id: 'problem',
    title: 'What Problem to Solve?',
    subtitle: 'Pick an area where you can make impact',
    icon: Lightbulb,
    optional: false,
    required: true
  },
  {
    id: 'audience',
    title: 'Who Will You Serve?',
    subtitle: 'Define your target audience',
    icon: Users,
    optional: false,
    required: true
  },
  {
    id: 'resources',
    title: 'Your Resources',
    subtitle: 'Budget and timeline preferences',
    icon: DollarSign,
    optional: false,
    required: true
  },
  {
    id: 'context',
    title: 'Personal Touch (Optional)',
    subtitle: 'Tell us about your unique perspective',
    icon: Brain,
    optional: true,
    required: false
  }
];
