import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/auth/supabase-server';
import { getCurrentSession } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerAdminClient();

    // Get the startup idea
    const { data: idea, error: ideaError } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.userId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Fetch Reddit sources if they exist
    const redditSources: Array<{
      reddit_id: string;
      subreddit: string;
      title: string;
      content: string;
      url: string;
      score: number;
      comments: number;
      author: string;
      created_utc: number;
    }> = [];

    // Reddit posts functionality disabled until table schema is updated

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