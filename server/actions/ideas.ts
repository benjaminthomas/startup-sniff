'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { generateStartupIdea, validateIdeaWithAI, type IdeaGenerationParams } from '@/lib/openai';
import { getTrendingPainPoints, generateIdeasFromPainPoints } from '@/lib/actions/reddit';

const generateIdeaSchema = z.object({
  industry: z.string().optional(),
  problemArea: z.string().optional(),
  targetAudience: z.string().optional(),
  budget: z.enum(['low', 'medium', 'high']).optional(),
  timeframe: z.enum(['short', 'medium', 'long']).optional(),
  userPrompt: z.string().optional(),
});

// Helper functions to map user selections to Reddit generation options
function mapIndustryToFocusArea(industry?: string): 'saas' | 'ecommerce' | 'marketplace' | 'mobile' | 'ai' | 'any' {
  if (!industry) return 'any';

  const industryMap: { [key: string]: ReturnType<typeof mapIndustryToFocusArea> } = {
    'technology': 'saas',
    'finance': 'saas',
    'healthcare': 'saas',
    'education': 'saas',
    'ecommerce': 'ecommerce',
    'entertainment': 'mobile',
    'transportation': 'mobile',
    'sustainability': 'any'
  };

  return industryMap[industry.toLowerCase()] || 'any';
}

function mapBudgetToComplexity(budget?: string): 'low' | 'medium' | 'high' {
  if (!budget) return 'medium';

  const budgetMap: { [key: string]: ReturnType<typeof mapBudgetToComplexity> } = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  };

  return budgetMap[budget] || 'medium';
}

function mapBudgetRange(budget?: string): 'bootstrap' | 'funded' | 'enterprise' {
  if (!budget) return 'bootstrap';

  const budgetMap: { [key: string]: ReturnType<typeof mapBudgetRange> } = {
    'low': 'bootstrap',
    'medium': 'funded',
    'high': 'enterprise'
  };

  return budgetMap[budget] || 'bootstrap';
}

// Favorites functionality
export async function toggleFavorite(ideaId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  try {
    // Get current favorite status
    const { data: currentIdea, error: fetchError } = await supabase
      .from('startup_ideas')
      .select('is_favorite')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      throw new Error('Idea not found or access denied');
    }

    // Toggle favorite status
    const newFavoriteStatus = !currentIdea.is_favorite;
    
    const { error: updateError } = await supabase
      .from('startup_ideas')
      .update({ is_favorite: newFavoriteStatus })
      .eq('id', ideaId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to update favorite status');
    }

    // Revalidate the ideas page to show updated state
    revalidatePath('/dashboard/ideas');
    revalidatePath('/dashboard');

    return {
      success: true,
      is_favorite: newFavoriteStatus
    };
  } catch (error) {
    console.error('Toggle favorite error:', error);
    throw new Error('Failed to toggle favorite');
  }
}

export async function generateIdea(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/signin');
  }

  // Validate form data
  const rawData = {
    industry: formData.get('industry') as string | null,
    problemArea: formData.get('problemArea') as string | null,
    targetAudience: formData.get('targetAudience') as string | null,
    budget: formData.get('budget') as string | null,
    timeframe: formData.get('timeframe') as string | null,
    userPrompt: formData.get('userPrompt') as string | null,
  };

  // Filter out null and empty string values
  const filteredData = Object.fromEntries(
    Object.entries(rawData).filter(([_, value]) => value !== null && value !== '')
  );

  const validationResult = generateIdeaSchema.safeParse(filteredData);
  if (!validationResult.success) {
    throw new Error('Invalid form data');
  }

  try {
    // Check usage limits
    const { data: usageData, error: usageError } = await supabase
      .from('usage_limits')
      .select('ideas_generated, monthly_limit_ideas')
      .eq('user_id', user.id)
      .single();

    if (usageError) {
      throw new Error('Failed to check usage limits');
    }

    if (usageData && (usageData.ideas_generated ?? 0) >= usageData.monthly_limit_ideas) {
      throw new Error('Usage limit reached. Please upgrade your plan.');
    }

    // Generate the startup idea using Reddit-powered system
    console.log('🧠 Using Reddit-powered idea generation...');

    // Map user selections to Reddit generation options
    const redditOptions = {
      focusArea: mapIndustryToFocusArea(validationResult.data.industry),
      complexityLevel: mapBudgetToComplexity(validationResult.data.budget),
      budgetRange: mapBudgetRange(validationResult.data.budget),
      timeframe: 'day',
      minOpportunityScore: 50
    };

    console.log('🔍 Reddit generation options:', redditOptions);

    // Generate ideas from Reddit pain points
    const redditIdeaResult = await generateIdeasFromPainPoints(redditOptions);
    let generatedIdea;
    let isFromReddit = false;

    if (!redditIdeaResult.success || redditIdeaResult.ideas.length === 0) {
      console.log('⚠️ Reddit generation failed, falling back to OpenAI...');
      // Fallback to old system if Reddit fails
      const ideaParams: IdeaGenerationParams = {
        ...validationResult.data,
        trends: [],
      };
      generatedIdea = await generateStartupIdea(ideaParams);
      isFromReddit = false;
    } else {
      console.log(`✅ Generated ${redditIdeaResult.ideas.length} ideas from Reddit pain points`);
      // Use the first (best) Reddit-generated idea
      const redditIdea = redditIdeaResult.ideas[0];
      generatedIdea = {
        title: redditIdea.title,
        description: redditIdea.problem_statement,
        problemStatement: redditIdea.problem_statement,
        solution: redditIdea.solution_approach,
        targetMarket: redditIdea.target_market.join(', '),
        revenueModel: (redditIdea as unknown as Record<string, unknown>).business_model ? ((redditIdea as unknown as Record<string, unknown>).business_model as Record<string, unknown>).revenue_streams as string[] : [],
        estimatedCost: (redditIdea as unknown as Record<string, unknown>).business_model ? ((redditIdea as unknown as Record<string, unknown>).business_model as Record<string, unknown>).funding_requirements as string : 'To be determined',
        timeToMarket: (redditIdea as unknown as Record<string, unknown>).technical_requirements ? ((redditIdea as unknown as Record<string, unknown>).technical_requirements as Record<string, unknown>).estimated_development_time as string : '3-6 months',
        marketSize: (redditIdea as unknown as Record<string, unknown>).market_analysis ? ((redditIdea as unknown as Record<string, unknown>).market_analysis as Record<string, unknown>).market_size_estimate as string : 'Medium',
        competition: (redditIdea as unknown as Record<string, unknown>).market_analysis ? ((redditIdea as unknown as Record<string, unknown>).market_analysis as Record<string, unknown>).competition_analysis as string : 'Analysis pending',
        uniqueValue: redditIdea.market_opportunity || 'High market potential',
        nextSteps: (redditIdea as unknown as Record<string, unknown>).market_analysis ? ((redditIdea as unknown as Record<string, unknown>).market_analysis as Record<string, unknown>).go_to_market_strategy as string[] : ['Market research', 'MVP development'],
        risks: ['Market competition', 'Technical challenges'],
        opportunities: [redditIdea.market_opportunity]
      };
      isFromReddit = true;
    }

    // Save the idea to the database
    const { data: savedIdea, error: saveError } = await supabase
      .from('startup_ideas')
      .insert({
        user_id: user.id,
        title: generatedIdea.title,
        problem_statement: generatedIdea.problemStatement,
        target_market: {
          description: generatedIdea.targetMarket,
          size: generatedIdea.marketSize,
        },
        solution: {
          description: generatedIdea.solution,
          unique_value_proposition: generatedIdea.uniqueValue,
          revenue_model: generatedIdea.revenueModel,
        },
        market_analysis: {
          competition: generatedIdea.competition,
          opportunities: generatedIdea.opportunities,
          risks: generatedIdea.risks,
        },
        implementation: {
          estimated_cost: generatedIdea.estimatedCost,
          time_to_market: generatedIdea.timeToMarket,
          next_steps: generatedIdea.nextSteps,
        },
        success_metrics: {
          // Add success metrics if available from AI generation
        },
        ai_confidence_score: isFromReddit && redditIdeaResult.success && redditIdeaResult.ideas.length > 0
          ? redditIdeaResult.ideas[0].confidence_score
          : Math.round(Math.random() * 30 + 70), // Fallback for non-Reddit ideas
        source_data: {
          generation_params: validationResult.data,
          generated_at: new Date().toISOString(),
          reddit_powered: isFromReddit,
          pain_point_sources: isFromReddit && redditIdeaResult.success
            ? (redditIdeaResult.ideas[0] as unknown as Record<string, unknown>).source_pain_point_ids as string[] || []
            : [],
          generation_method: isFromReddit ? 'reddit_pain_points' : 'openai_prompts'
        },
        is_validated: false,
        is_favorite: false,
        validation_data: null
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving idea:', saveError);
      throw new Error('Failed to save generated idea');
    }

    // Update usage limits - count actual ideas to ensure accuracy
    const { data: allIdeas, error: countError } = await supabase
      .from('startup_ideas')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    if (!countError) {
      const actualIdeasCount = allIdeas.length || 0
      console.log(`📊 Updating usage limits: ${actualIdeasCount} ideas generated`)
      
      const { error: updateError } = await supabase
        .from('usage_limits')
        .update({
          ideas_generated: actualIdeasCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Usage limits update error:', updateError);
      } else {
        console.log('✅ Usage limits updated with actual count:', actualIdeasCount)
      }
    } else {
      console.error('❌ Error counting ideas:', countError);
    }

    // Revalidate the dashboard page
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/ideas');

    return { success: true, idea: savedIdea };
  } catch (error) {
    console.error('Error generating idea:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate idea');
  }
}

export async function validateIdea(ideaId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/signin');
  }

  try {
    // Get the idea
    const { data: idea, error: ideaError } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (ideaError || !idea) {
      throw new Error('Idea not found');
    }

    // Generate validation using AI
    const validation = await validateIdeaWithAI(
      `${idea.title}\n\nProblem: ${idea.problem_statement}\n\nSolution: ${JSON.stringify(idea.solution)}`
    );

    // Update the idea with validation results
    const { error: updateError } = await supabase
      .from('startup_ideas')
      .update({
        is_validated: true,
        validation_data: {
          ...validation,
          validation_score: Math.round(
            (validation.feasibilityScore + validation.marketPotential + (10 - validation.competitionLevel)) / 3
          ),
          validated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', ideaId)
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to update idea with validation');
    }

    revalidatePath('/dashboard/ideas');
    return { success: true, validation };
  } catch (error) {
    console.error('Error validating idea:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to validate idea');
  }
}

export async function getUserIdeas(limit: number = 10) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('❌ getUserIdeas: No authenticated user');
    return [];
  }

  console.log('🔍 getUserIdeas called for user:', {
    userId: user?.id,
    userEmail: user?.email
  });

  try {
    const { data: ideas, error } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log(`📋 Found ${ideas?.length || 0} ideas for user ${user.id}`);

    if (error) {
      console.error('Error fetching ideas:', error);
      return [];
    }

    return ideas || [];
  } catch (error) {
    console.error('Error getting user ideas:', error);
    return [];
  }
}

export async function getIdeaWithRedditSources(ideaId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  try {
    // Get the startup idea
    const { data: idea, error: ideaError } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (ideaError || !idea) {
      throw new Error('Idea not found');
    }

    // Extract Reddit source IDs from source_data
    const painPointSources = (idea.source_data as Record<string, unknown>)?.pain_point_sources as string[] || [];

    if (painPointSources.length === 0) {
      return { idea, redditSources: [] };
    }

    // Fetch corresponding Reddit posts
    const { data: redditPosts, error: redditError } = await supabase
      .from('reddit_posts')
      .select('reddit_id, subreddit, title, content, url, score, comments, author, created_utc')
      .in('reddit_id', painPointSources);

    if (redditError) {
      console.error('Error fetching Reddit sources:', redditError);
      return { idea, redditSources: [] };
    }

    console.log(`📰 Found ${redditPosts?.length || 0} Reddit sources for idea ${ideaId}`);

    return {
      idea,
      redditSources: redditPosts || []
    };
  } catch (error) {
    console.error('Error getting idea with Reddit sources:', error);
    throw error;
  }
}