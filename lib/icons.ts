// lib/icons.ts - StartupSniff Icon System
import {
  // Idea Generation
  Lightbulb,
  Sparkles,
  Zap,
  
  // Market Validation
  Target,
  BarChart3,
  TrendingUp,
  Users,
  
  // Content Creation
  FileText,
  PenTool,
  Share2,
  Mail,
  Layout,
  
  // Reddit Analysis
  MessageCircle,
  MessageSquare,
  
  // User Interface
  LayoutDashboard,
  User,
  Settings,
  Bell,
  Search,
  Home,
  
  // Actions
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Copy,
  
  // States & Feedback
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  
  // Navigation
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  
  // Subscription & Billing
  CreditCard,
  DollarSign,
  Calendar,
  
  // Visibility & Privacy
  Eye,
  EyeOff,
  Globe,
  Lock,
  
  // Content Types
  Type,
  Image,
  Video,
  Link,
  
  // Additional Common Icons
  Heart,
  Star,
  Bookmark,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react'

/**
 * StartupSniff Feature-Specific Icon Mappings
 * Provides semantic icon names for consistent usage across the application
 */
export const FeatureIcons = {
  // Idea Generation
  IdeaGeneration: Lightbulb,
  AiGenerating: Sparkles,
  BrainStorming: Zap,
  
  // Market Validation  
  MarketResearch: Target,
  DataAnalysis: BarChart3,
  TrendAnalysis: TrendingUp,
  CompetitorAnalysis: Users,
  
  // Content Creation
  BlogPost: FileText,
  SocialContent: Share2,
  EmailCampaign: Mail,
  LandingPage: Layout,
  ContentWriting: PenTool,
  
  // Reddit Analysis
  RedditTrends: MessageCircle,
  CommunityInsights: Users,
  DiscussionAnalysis: MessageSquare,
  
  // User Interface
  Dashboard: LayoutDashboard,
  Profile: User,
  Settings: Settings,
  Notifications: Bell,
  Search: Search,
  Home: Home,
  
  // Actions
  Create: Plus,
  Edit: Edit,
  Delete: Trash2,
  Save: Save,
  Export: Download,
  Share: Share2,
  Copy: Copy,
  
  // States & Feedback
  Loading: Loader2,
  Success: CheckCircle,
  Warning: AlertTriangle,
  Error: AlertCircle,
  Info: Info,
  
  // Navigation
  Back: ArrowLeft,
  Forward: ArrowRight,
  Up: ArrowUp,
  Down: ArrowDown,
  External: ExternalLink,
  
  // Subscription & Billing
  Billing: CreditCard,
  Pricing: DollarSign,
  Calendar: Calendar,
  Plan: Zap,
  Upgrade: ArrowUp,
  
  // Visibility & Privacy
  Show: Eye,
  Hide: EyeOff,
  Public: Globe,
  Private: Lock,
  
  // Content Types
  Text: Type,
  Image: Image,
  Video: Video,
  File: FileText,
  Link: Link,
  
  // Interaction States
  Like: Heart,
  Favorite: Star,
  Bookmark: Bookmark,
  Filter: Filter,
  SortAsc: SortAsc,
  SortDesc: SortDesc,
  Refresh: RefreshCw,
  
  // Layout & Navigation
  Menu: Menu,
  Close: X,
  ExpandDown: ChevronDown,
  CollapseUp: ChevronUp,
  PrevPage: ChevronLeft,
  NextPage: ChevronRight,
  MoreActions: MoreHorizontal,
  MoreOptions: MoreVertical
} as const

/**
 * Icon size classes for consistent sizing
 */
export const IconSizes = {
  xs: 'h-3 w-3',     // 12px - Inline text
  sm: 'h-4 w-4',     // 16px - Small buttons, badges
  md: 'h-5 w-5',     // 20px - Default buttons, nav
  lg: 'h-6 w-6',     // 24px - Headers, large buttons
  xl: 'h-8 w-8',     // 32px - Feature highlights
  '2xl': 'h-12 w-12' // 48px - Hero sections
} as const

/**
 * StartupSniff Icon Categories for quick reference
 */
export const IconCategories = {
  idea_generation: [FeatureIcons.IdeaGeneration, FeatureIcons.AiGenerating, FeatureIcons.BrainStorming],
  market_validation: [FeatureIcons.MarketResearch, FeatureIcons.DataAnalysis, FeatureIcons.TrendAnalysis],
  content_creation: [FeatureIcons.BlogPost, FeatureIcons.SocialContent, FeatureIcons.EmailCampaign],
  reddit_analysis: [FeatureIcons.RedditTrends, FeatureIcons.CommunityInsights, FeatureIcons.DiscussionAnalysis],
  navigation: [FeatureIcons.Home, FeatureIcons.Search, FeatureIcons.Bell, FeatureIcons.User],
  actions: [FeatureIcons.Create, FeatureIcons.Edit, FeatureIcons.Delete, FeatureIcons.Save],
  states: [FeatureIcons.Loading, FeatureIcons.Success, FeatureIcons.Warning, FeatureIcons.Error],
  billing: [FeatureIcons.Billing, FeatureIcons.Pricing, FeatureIcons.Calendar],
  analytics: [FeatureIcons.DataAnalysis, FeatureIcons.TrendAnalysis, FeatureIcons.Dashboard]
} as const

export type IconSize = keyof typeof IconSizes
export type FeatureIconName = keyof typeof FeatureIcons