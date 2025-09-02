'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { generateStartupIdea, validateIdeaWithAI, type IdeaGenerationParams } from '@/lib/openai';

const generateIdeaSchema = z.object({
  industry: z.string().optional(),
  problemArea: z.string().optional(),
  targetAudience: z.string().optional(),
  budget: z.enum(['low', 'medium', 'high']).optional(),
  timeframe: z.enum(['short', 'medium', 'long']).optional(),
  userPrompt: z.string().optional(),
});

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

    if (usageData && usageData.ideas_generated >= usageData.monthly_limit_ideas) {
      throw new Error('Usage limit reached. Please upgrade your plan.');
    }

    // Generate the startup idea using OpenAI
    const ideaParams: IdeaGenerationParams = {
      ...validationResult.data,
      trends: [], // TODO: Add trending topics from Reddit analysis
    };

    const generatedIdea = await generateStartupIdea(ideaParams);

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
        ai_confidence_score: Math.round(Math.random() * 30 + 70), // Placeholder until AI provides this
        source_data: {
          generation_params: validationResult.data,
          generated_at: new Date().toISOString(),
        }
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