import {
  FileText,
  MessageCircle,
  Mail,
  Globe,
  Target,
  Sparkles,
} from "lucide-react";

/**
 * Get the appropriate icon component for a content type
 */
export function getContentIcon(type: string) {
  switch (type) {
    case 'blog_post': return <FileText className="h-4 w-4" />;
    case 'tweet': return <MessageCircle className="h-4 w-4" />;
    case 'email': return <Mail className="h-4 w-4" />;
    case 'landing_page': return <Globe className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

/**
 * Get the human-readable label for a content type
 */
export function getContentTypeLabel(type: string): string {
  switch (type) {
    case 'blog_post': return 'Blog Post';
    case 'tweet': return 'Twitter Thread';
    case 'email': return 'Email Campaign';
    case 'landing_page': return 'Landing Page';
    default: return 'Content';
  }
}

/**
 * Get the color classes for a content type badge
 */
export function getContentTypeColor(type: string): string {
  switch (type) {
    case 'blog_post':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/10 dark:text-blue-300 dark:border-blue-800';
    case 'tweet':
      return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/10 dark:text-sky-300 dark:border-sky-800';
    case 'email':
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/10 dark:text-green-300 dark:border-green-800';
    case 'landing_page':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/10 dark:text-purple-300 dark:border-purple-800';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-950/10 dark:text-gray-300 dark:border-gray-800';
  }
}

/**
 * Get the color classes for a content type badge in dialog context
 */
export function getContentTypeColorDialog(type: string): string {
  switch (type) {
    case 'blog_post':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'tweet':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
    case 'email':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'landing_page':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

/**
 * Get the appropriate icon for a brand voice
 */
export function getBrandVoiceIcon(voice: string) {
  switch (voice) {
    case 'technical': return <Target className="h-3 w-3" />;
    case 'growth_hacker': return <Target className="h-3 w-3" />;
    case 'storyteller': return <MessageCircle className="h-3 w-3" />;
    case 'educator': return <FileText className="h-3 w-3" />;
    case 'contrarian': return <Sparkles className="h-3 w-3" />;
    default: return <Sparkles className="h-3 w-3" />;
  }
}

/**
 * Calculate estimated reading time in minutes
 */
export function calculateReadingTime(contentLength: number): number {
  // Assuming average reading speed of 1000 characters per minute
  return Math.ceil(contentLength / 1000);
}

/**
 * Calculate approximate word count from content length
 */
export function calculateWordCount(contentLength: number): number {
  // Assuming average word length of 5 characters
  return Math.ceil(contentLength / 5);
}

/**
 * Format a date for display
 */
export function formatContentDate(dateString: string, format: 'full' | 'short' = 'full'): string {
  const date = new Date(dateString);

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  return date.toLocaleDateString();
}

/**
 * Truncate content for preview
 */
export function truncateContent(content: string, maxLength: number = 280): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '...';
}
