import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the startup idea
    const { data: idea, error: ideaError } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Fetch Reddit sources if they exist
    let redditSources: any[] = [];
    const painPointSources = idea.source_data?.pain_point_sources || [];

    if (painPointSources.length > 0) {
      const { data: redditPosts } = await supabase
        .from('reddit_posts')
        .select('reddit_id, subreddit, title, content, url, score, comments, author, created_utc')
        .in('reddit_id', painPointSources);

      redditSources = redditPosts || [];
    }

    // Return the idea data with Reddit sources
    return NextResponse.json({
      ...idea,
      redditSources
    });
  } catch (error) {
    console.error('Error exporting idea:', error);
    return NextResponse.json({ error: 'Failed to export idea' }, { status: 500 });
  }
}