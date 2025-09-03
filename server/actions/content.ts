'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';
import { openai } from '@/lib/openai';
import { CONTENT_TYPES, BRAND_VOICES, VALIDATION_SCHEMAS } from '@/constants';

const generateContentSchema = z.object({
  contentType: z.enum(['blog_post', 'tweet', 'email', 'landing_page']),
  tone: z.string().transform(val => val === '' ? 'professional' : val).pipe(z.enum(['professional', 'casual', 'exciting', 'authoritative', 'friendly'])),
  topic: z.string().min(1).max(VALIDATION_SCHEMAS.CONTENT_TITLE_MAX_LENGTH),
  keyPoints: z.string().max(VALIDATION_SCHEMAS.CONTENT_MAX_LENGTH),
  targetAudience: z.string().max(200),
  startupIdea: z.string().optional(), // Optional startup idea context
});

export async function generateContent(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/signin');
  }

  // Validate form data
  const rawData = {
    contentType: formData.get('contentType') as string,
    tone: formData.get('tone') as string,
    topic: formData.get('topic') as string,
    keyPoints: formData.get('keyPoints') as string,
    targetAudience: formData.get('targetAudience') as string,
    startupIdea: formData.get('startupIdea') as string || '',
  };

  const validationResult = generateContentSchema.safeParse(rawData);
  if (!validationResult.success) {
    throw new Error('Invalid form data: ' + validationResult.error.message);
  }

  try {
    // Check usage limits by counting actual content
    const { data: userData } = await supabase
      .from('users')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    const planLimits = {
      explorer: 5,
      founder: 50,
      growth: -1 // Unlimited
    };
    
    const userPlan = userData?.plan_type || 'explorer';
    const monthlyLimit = planLimits[userPlan as keyof typeof planLimits];
    
    if (monthlyLimit !== -1) {
      // Count existing content
      const { data: existingContent, error: countError } = await supabase
        .from('generated_content')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      const currentContentCount = existingContent?.length || 0;
      
      if (currentContentCount >= monthlyLimit) {
        throw new Error('Content generation limit reached. Please upgrade your plan.');
      }
    }

    // Generate content using OpenAI (fallback to Claude pattern if needed)
    const generatedContent = await generateContentWithAI(validationResult.data);

    // Save the content to the database
    const { data: savedContent, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id,
        content_type: validationResult.data.contentType,
        title: generatedContent.title,
        content: generatedContent.content,
        brand_voice: validationResult.data.tone,
        seo_keywords: generatedContent.seoKeywords,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving content:', saveError);
      throw new Error('Failed to save generated content');
    }

    console.log(`📝 Content generated successfully for user ${user.id}: ${savedContent.title}`);

    // Revalidate the content page
    revalidatePath('/dashboard/content');

    return { success: true, content: savedContent };
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate content');
  }
}

async function generateContentWithAI(params: z.infer<typeof generateContentSchema>) {
  const contentPrompts = {
    blog_post: `Write a comprehensive blog post about "${params.topic}". 
    Target audience: ${params.targetAudience}
    Key points to cover: ${params.keyPoints}
    Tone: ${params.tone}
    
    Structure the post with:
    - Compelling headline
    - Introduction hook
    - Main content with subheadings
    - Conclusion with call-to-action
    
    Make it SEO-friendly and engaging.`,

    tweet: `Create a Twitter thread about "${params.topic}".
    Target audience: ${params.targetAudience}
    Key points: ${params.keyPoints}
    Tone: ${params.tone}
    
    Create 5-8 tweets that:
    - Start with a hook
    - Include relevant hashtags
    - End with engagement question
    - Use line breaks for readability`,

    email: `Write an email campaign about "${params.topic}".
    Target audience: ${params.targetAudience}
    Key points: ${params.keyPoints}
    Tone: ${params.tone}
    
    Include:
    - Compelling subject line
    - Personal greeting
    - Value-driven content
    - Clear call-to-action
    - Professional signature`,

    landing_page: `Create landing page copy for "${params.topic}".
    Target audience: ${params.targetAudience}
    Key points: ${params.keyPoints}
    Tone: ${params.tone}
    
    Structure:
    - Powerful headline
    - Subheadline
    - Benefits list
    - Social proof section
    - Strong call-to-action
    - FAQ section`
  };

  const systemPrompt = `You are an expert content marketing writer with deep knowledge of startup marketing, copywriting, and content strategy. 

Create high-quality, engaging content that:
- Resonates with the target audience
- Includes relevant keywords naturally
- Has a clear value proposition
- Drives action/engagement
- Follows best practices for the content type

IMPORTANT: Return a valid JSON object with the following structure:
{
  "title": "Compelling title for the content",
  "content": "The full content piece",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "estimatedReadTime": "X min read",
  "contentType": "${params.contentType}"
}`;

  try {
    // Use mock data if OpenAI API key is not configured
    if (!openai) {
      console.log('Using mock content - OpenAI API key not configured');
      // Add small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateMockContent(params);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentPrompts[params.contentType] }
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', response);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate required fields
    const requiredFields = ['title', 'content', 'seoKeywords'];
    for (const field of requiredFields) {
      if (!parsedContent[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      title: parsedContent.title,
      content: parsedContent.content,
      seoKeywords: parsedContent.seoKeywords,
      estimatedReadTime: parsedContent.estimatedReadTime || '3 min read',
      contentType: params.contentType
    };
  } catch (error) {
    console.error('Error generating content with AI:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        // Fallback to mock data if API key issues
        console.log('Falling back to mock content due to API key issues');
        return generateMockContent(params);
      }
      if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please try again later.');
      }
      throw error;
    }
    
    throw new Error('Failed to generate content. Please try again.');
  }
}

function generateMockContent(params: z.infer<typeof generateContentSchema>) {
  const mockContent = {
    blog_post: {
      title: `The Ultimate Guide to ${params.topic}`,
      content: `# The Ultimate Guide to ${params.topic}

## Introduction

In today's competitive landscape, understanding ${params.topic} is crucial for success. This comprehensive guide will walk you through everything you need to know.

## Why ${params.topic} Matters

${params.keyPoints}

## Key Strategies

1. **Strategy One**: Focus on your target audience - ${params.targetAudience}
2. **Strategy Two**: Implement best practices consistently
3. **Strategy Three**: Monitor and optimize your results

## Conclusion

By following these guidelines, you'll be well-equipped to master ${params.topic} and achieve your goals.

*Ready to get started? Take action today!*`,
      seoKeywords: [params.topic.toLowerCase(), 'startup', 'guide'],
    },
    tweet: {
      title: `Twitter Thread: ${params.topic}`,
      content: `🧵 Thread: Everything you need to know about ${params.topic}

1/ ${params.topic} is becoming increasingly important for ${params.targetAudience}

2/ Key insights:
${params.keyPoints}

3/ The biggest mistake? Not starting early enough.

4/ Pro tip: Focus on one thing at a time and execute well.

5/ What questions do you have about ${params.topic}? Drop them below! 👇

#startup #${params.topic.replace(/\s+/g, '').toLowerCase()}`,
      seoKeywords: [params.topic.toLowerCase(), 'twitter', 'thread'],
    },
    email: {
      title: `Email: ${params.topic}`,
      content: `Subject: The ${params.topic} strategy that's changing everything

Hi there,

I wanted to share something exciting about ${params.topic} that could transform your approach.

${params.keyPoints}

This approach has been game-changing for ${params.targetAudience}, and I thought you'd want to know about it.

Want to learn more? Reply to this email and let's discuss!

Best,
Your StartupSniff Team`,
      seoKeywords: [params.topic.toLowerCase(), 'email', 'marketing'],
    },
    landing_page: {
      title: `Landing Page: ${params.topic}`,
      content: `# Transform Your Business with ${params.topic}

## The Solution ${params.targetAudience} Have Been Waiting For

${params.keyPoints}

### Why Choose Us?
✅ Proven results
✅ Expert guidance  
✅ 24/7 support

### What Our Customers Say
"This changed everything for our business!" - Happy Customer

### Ready to Get Started?

[Get Started Now] [Learn More]

*Join thousands of satisfied customers today*`,
      seoKeywords: [params.topic.toLowerCase(), 'landing page', 'conversion'],
    }
  };

  const template = mockContent[params.contentType];
  
  return {
    title: template.title,
    content: template.content,
    seoKeywords: template.seoKeywords,
    estimatedReadTime: '3 min read',
    contentType: params.contentType
  };
}

export async function getUserContent(limit: number = 10) {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.log('❌ getUserContent: No authenticated user');
    return [];
  }

  console.log('🔍 getUserContent called for user:', { 
    userId: user?.id, 
    userEmail: user?.email 
  });

  try {
    const { data: content, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log(`📄 Found ${content?.length || 0} content pieces for user ${user.id}`);

    if (error) {
      console.error('Error fetching content:', error);
      return [];
    }

    return content || [];
  } catch (error) {
    console.error('Error getting user content:', error);
    return [];
  }
}

export async function deleteContent(contentId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  try {
    const { error } = await supabase
      .from('generated_content')
      .delete()
      .eq('id', contentId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error('Failed to delete content');
    }

    console.log(`🗑️ Content deleted successfully for user ${user.id}: ${contentId}`);

    revalidatePath('/dashboard/content');
    return { success: true };
  } catch (error) {
    console.error('Error deleting content:', error);
    throw new Error('Failed to delete content');
  }
}