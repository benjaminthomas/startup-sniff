import { useMemo } from 'react';
import { GeneratedContent } from '@/features/content/components/ContentCard';

export function useContentFiltering(content: GeneratedContent[]) {
  // Group content by type
  const contentByType = useMemo(() => {
    return content.reduce((acc, item) => {
      if (!acc[item.content_type]) {
        acc[item.content_type] = [];
      }
      acc[item.content_type].push(item);
      return acc;
    }, {} as Record<string, GeneratedContent[]>);
  }, [content]);

  // Get content counts by type
  const contentCounts = useMemo(() => {
    return {
      all: content.length,
      blog_post: contentByType.blog_post?.length || 0,
      tweet: contentByType.tweet?.length || 0,
      email: contentByType.email?.length || 0,
      landing_page: contentByType.landing_page?.length || 0,
    };
  }, [content.length, contentByType]);

  return {
    contentByType,
    contentCounts,
  };
}
