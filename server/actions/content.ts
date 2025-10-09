'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerAdminClient } from '@/lib/auth/supabase-server';
import { getCurrentSession } from '@/lib/auth/jwt';
import { openai } from '@/lib/openai';
import { VALIDATION_SCHEMAS } from '@/constants';
import { incrementUsage } from '@/server/actions/plan-limits';

const generateContentSchema = z.object({
  contentType: z.enum(['blog_post', 'tweet', 'email', 'landing_page']),
  tone: z.string().transform(val => val === '' ? 'professional' : val).pipe(z.enum(['professional', 'casual', 'exciting', 'authoritative', 'friendly'])),
  topic: z.string().min(1).max(VALIDATION_SCHEMAS.CONTENT_TITLE_MAX_LENGTH),
  keyPoints: z.string().max(VALIDATION_SCHEMAS.CONTENT_MAX_LENGTH),
  targetAudience: z.string().max(200),
  startupIdea: z.string().optional(), // Optional startup idea context
});

export async function generateContent(formData: FormData) {
  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    redirect('/auth/signin');
  }

  const supabase = createServerAdminClient();

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
      .eq('id', session.userId)
      .single();

    const planLimits = {
      explorer: 3,
      founder: 50,
      growth: -1 // Unlimited
    };
    
    const userPlan = userData?.plan_type || 'explorer';
    const monthlyLimit = planLimits[userPlan as keyof typeof planLimits];
    
    if (monthlyLimit !== -1) {
      // Count existing content
      const { data: existingContent } = await supabase
        .from('generated_content')
        .select('id', { count: 'exact' })
        .eq('user_id', session.userId);

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
        user_id: session.userId,
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

    console.log(`📝 Content generated successfully for user ${session.userId}: ${savedContent.title}`);

    // Increment usage count
    await incrementUsage('content');

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
    blog_post: `Write a deeply engaging, story-driven blog post about "${params.topic}" that feels like a conversation with a knowledgeable friend.

    Target audience: ${params.targetAudience}
    Key insights to weave in naturally: ${params.keyPoints}
    Voice and tone: ${params.tone}

    Create a blog post that:
    - Opens with a relatable scenario, question, or surprising insight that hooks readers immediately
    - Uses storytelling techniques with real examples, case studies, or personal anecdotes
    - Breaks complex concepts into digestible, actionable steps
    - Includes conversational transitions like "Here's the thing..." or "But wait, there's more..."
    - Uses subheadings that create curiosity and maintain reading momentum
    - Incorporates bullet points and lists for scanability
    - Addresses common objections and concerns naturally
    - Ends with a compelling call-to-action that feels helpful rather than pushy
    - Includes strategic questions to engage readers and encourage comments

    Make it feel authentic, valuable, and genuinely helpful.`,

    tweet: `Create a captivating Twitter thread about "${params.topic}" that sparks genuine conversation and engagement.

    Target audience: ${params.targetAudience}
    Core insights: ${params.keyPoints}
    Voice: ${params.tone} but always authentic and relatable

    Craft 6-10 tweets that:
    - Start with a scroll-stopping hook that makes people want to read more
    - Tell a mini-story or share a surprising insight in the first tweet
    - Use natural, conversational language (avoid corporate speak)
    - Include personal touches, opinions, or behind-the-scenes moments
    - Break up longer thoughts with strategic line breaks and emojis
    - Add relevant hashtags that feel natural, not forced
    - Include a call-to-action that invites genuine discussion
    - End with an engaging question or invitation to share experiences
    - Use thread numbering (1/X, 2/X) for easy following

    Make each tweet valuable on its own while building toward a powerful conclusion.`,

    email: `Write a compelling email about "${params.topic}" that feels like it's coming from a trusted friend or advisor.

    Target audience: ${params.targetAudience}
    Key value points: ${params.keyPoints}
    Tone: ${params.tone}

    Create an email that:
    - Uses a curiosity-driven subject line that feels personal, not promotional
    - Opens with a warm, conversational greeting and quick personal connection
    - Tells a brief story or shares a relatable experience that leads into the main topic
    - Presents information in a helpful, non-salesy way
    - Uses short paragraphs and plenty of white space for easy reading
    - Includes specific, actionable advice they can implement immediately
    - Addresses potential concerns or questions naturally in the flow
    - Ends with a soft, helpful call-to-action that provides genuine value
    - Closes with a warm, authentic signature that invites response

    Make it feel like a valuable message from someone who genuinely cares about their success.`,

    landing_page: `Create persuasive landing page copy for "${params.topic}" that converts through authentic value rather than hype.

    Target audience: ${params.targetAudience}
    Core benefits: ${params.keyPoints}
    Brand voice: ${params.tone}

    Structure compelling copy with:
    - A headline that immediately communicates the core benefit and speaks to their specific pain point
    - A subheadline that adds context and builds on the promise
    - An opening section that acknowledges their current struggle and positions your solution empathetically
    - Benefit-focused bullet points that paint a picture of their improved future state
    - Social proof section with realistic, specific testimonials (you can create plausible examples)
    - A clear value proposition that explains why this solution is different and better
    - Risk-reversal elements that address their concerns about making a decision
    - Multiple call-to-action buttons with action-oriented, benefit-focused text
    - FAQ section that addresses the most common objections and concerns

    Make every word work toward building trust and demonstrating value.`
  };

  const systemPrompt = `You are a world-class content marketing writer and storyteller who creates authentic, human-centered content that genuinely connects with people. You have deep expertise in startup marketing, copywriting, psychology, and persuasive communication.

Create compelling, humanized content that feels genuine and conversational by:
- Writing like you're talking to a close friend or trusted advisor
- Using personal anecdotes, relatable examples, and stories when appropriate
- Including emotional hooks and authentic vulnerability
- Avoiding corporate jargon and overly salesy language
- Adding personality, humor, and warmth where suitable
- Using "you" language to make it personal and direct
- Including specific, actionable insights rather than generic advice
- Making complex topics accessible and easy to understand
- Adding conversational transitions and natural flow
- Including relevant data/statistics to support claims

Write content that:
- Resonates deeply with the target audience's pain points and aspirations
- Includes relevant keywords naturally and conversationally
- Has a clear, compelling value proposition
- Drives genuine engagement and action
- Follows industry best practices while maintaining authenticity
- Feels like it was written by a real human with expertise and empathy

IMPORTANT: Return a valid JSON object with this exact structure:
{
  "title": "Compelling, benefit-focused title that speaks directly to the reader",
  "content": "The full humanized content piece with natural flow and personality",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "estimatedReadTime": "X min read",
  "contentType": "${params.contentType}",
  "engagementScore": 85,
  "wordCount": 1250
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
    let parsedContent: {
      title: string;
      content: string;
      seo_keywords?: string[];
    };
    try {
      parsedContent = JSON.parse(response);
    } catch {
      console.error('Failed to parse OpenAI response as JSON:', response);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate required fields
    const requiredFields = ['title', 'content', 'seoKeywords'] as const;
    for (const field of requiredFields) {
      if (!(parsedContent as Record<string, unknown>)[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      title: parsedContent.title,
      content: parsedContent.content,
      seoKeywords: (parsedContent as Record<string, unknown>).seoKeywords as string[],
      estimatedReadTime: (parsedContent as Record<string, unknown>).estimatedReadTime as string || '3 min read',
      contentType: params.contentType,
      engagementScore: (parsedContent as Record<string, unknown>).engagementScore as number || 75,
      wordCount: (parsedContent as Record<string, unknown>).wordCount as number || Math.ceil(parsedContent.content.length / 5)
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
      title: `What I Learned About ${params.topic} (And Why It Changed Everything)`,
      content: `# What I Learned About ${params.topic} (And Why It Changed Everything)

*This isn't another generic guide. This is what actually works.*

## Here's the thing nobody tells you...

When I first started exploring ${params.topic}, I thought it would be straightforward. Boy, was I wrong.

After countless hours, failed attempts, and conversations with ${params.targetAudience}, I've learned something crucial: ${params.keyPoints}

## The "Aha!" moments that changed my perspective

Let me share what really clicked for me:

### 1. Stop overthinking it
Here's what I wish someone had told me from day one: perfection is the enemy of progress. When working with ${params.targetAudience}, I discovered that authenticity beats polish every single time.

### 2. Listen more than you speak
The breakthrough came when I started really paying attention to what ${params.targetAudience} were actually saying. Not what I thought they needed, but what they were desperately asking for.

### 3. Small wins compound
Instead of trying to do everything at once, I focused on tiny, consistent improvements. The results? Mind-blowing.

## What this means for you

If you're feeling overwhelmed by ${params.topic}, you're not alone. Every expert was once a beginner who refused to give up.

The key is starting where you are, with what you have. Don't wait for the perfect moment—it doesn't exist.

**Your turn:** What's one small step you can take today? I'd love to hear about it in the comments below.

*P.S. - If this helped you, share it with someone who needs to read it. Sometimes we all need a reminder that we're not alone in this journey.*`,
      seoKeywords: [params.topic.toLowerCase(), 'startup guide', 'practical tips', 'beginners', 'strategy'],
    },
    tweet: {
      title: `Real Talk About ${params.topic}`,
      content: `🧵 THREAD: The uncomfortable truth about ${params.topic} that nobody talks about

1/ Everyone makes it look easy on social media, but here's what's really happening behind the scenes...

${params.targetAudience} are struggling with the same challenges you are. You're not behind. You're not failing. You're human.

2/ The game-changer for me wasn't some secret strategy or expensive tool.

It was this simple shift: ${params.keyPoints}

3/ Plot twist: The experts didn't start as experts.

They started as confused beginners who kept showing up despite feeling like frauds. Sound familiar?

4/ Here's what actually works:
→ Start messy
→ Iterate quickly
→ Listen to real feedback
→ Ignore the noise

5/ The biggest lie we tell ourselves? "I'll start when I'm ready."

Ready is a myth. Prepared is achievable.

6/ What's one thing you've been putting off because it doesn't feel "perfect" yet?

Drop it below. Let's normalize starting before we're ready. 👇

#startup #${params.topic.replace(/\s+/g, '').toLowerCase()} #entrepreneurship #realttalk`,
      seoKeywords: [params.topic.toLowerCase(), 'entrepreneurship', 'startup tips', 'motivation'],
    },
    email: {
      title: `The ${params.topic} Mistake I Made (So You Don't Have To)`,
      content: `Subject: The ${params.topic} mistake I made (so you don't have to)

Hey there,

I made a $10,000 mistake last month.

And honestly? I'm kind of grateful for it.

Here's what happened...

I was so focused on getting ${params.topic} "right" that I spent three months planning instead of doing. Three months of research, competitor analysis, and strategy documents that never saw the light of day.

The wake-up call? A conversation with someone from ${params.targetAudience} who said, "I wish someone would just START helping us with this stuff instead of talking about it."

Ouch. But also... exactly what I needed to hear.

The lesson that changed everything: ${params.keyPoints}

Since then, I've completely shifted my approach. Instead of waiting for perfect, I ship messy. Instead of guessing what people want, I ask them directly.

The results have been incredible.

Here's what I'm curious about: What's something you've been overthinking lately? Hit reply and tell me about it. I read every email personally.

Sometimes we just need someone to remind us that done is better than perfect.

Cheering you on,

[Your name]

P.S. - If this email resonated with you, would you mind forwarding it to one person who might need to read it too? We're all in this together.`,
      seoKeywords: [params.topic.toLowerCase(), 'entrepreneur lessons', 'business mistakes', 'startup journey'],
    },
    landing_page: {
      title: `Finally, ${params.topic} That Actually Works for ${params.targetAudience}`,
      content: `# Finally, ${params.topic} That Actually Works for ${params.targetAudience}

## Tired of cookie-cutter solutions that don't fit your reality?

You're not alone. Most ${params.targetAudience} are drowning in generic advice that sounds great in theory but falls apart in practice.

Here's the truth: ${params.keyPoints}

### What makes this different?

❌ **Other solutions:** One-size-fits-all approaches that ignore your specific challenges
✅ **Our approach:** Customized strategies built for real businesses with real constraints

❌ **Other solutions:** Complicated systems that require a PhD to implement
✅ **Our approach:** Simple, actionable steps you can implement this week

❌ **Other solutions:** Promise overnight success (spoiler: it doesn't exist)
✅ **Our approach:** Honest timeline with measurable milestones along the way

### Here's what Sarah from TechFlow said:
*"I was skeptical at first—I'd tried everything. But within 30 days, I saw results I hadn't experienced in two years of trying other methods. Finally, something that works for actual businesses, not just case studies."*

### Ready to stop spinning your wheels?

This isn't about perfection. It's about progress.
This isn't about overnight success. It's about sustainable growth.
This isn't about following someone else's playbook. It's about building your own.

**[Get Started Today - Risk-Free]**

### Still have questions? (Of course you do.)

**Q: Is this another "guru" program?**
A: Nope. This is practical, tested-in-the-trenches guidance from someone who's made all the mistakes so you don't have to.

**Q: How quickly will I see results?**
A: Most people see their first meaningful result within 2-3 weeks. But we're building something sustainable, not chasing quick wins.

**Q: What if it doesn't work for my situation?**
A: If you don't see measurable progress within 60 days, we'll refund every penny. No questions, no hassle.

**[Start Your Journey Today]**

*Join 2,847 ${params.targetAudience} who are finally making progress that matters.*`,
      seoKeywords: [params.topic.toLowerCase(), 'solutions for startups', 'business growth', 'proven results'],
    }
  };

  const template = mockContent[params.contentType];

  return {
    title: template.title,
    content: template.content,
    seoKeywords: template.seoKeywords,
    estimatedReadTime: `${Math.ceil(template.content.length / 1000)} min read`,
    contentType: params.contentType,
    engagementScore: Math.floor(Math.random() * 20) + 75, // 75-95
    wordCount: Math.ceil(template.content.length / 5)
  };
}

export async function getUserContent(limit: number = 10) {
  const session = await getCurrentSession();
  if (!session) {
    console.log('❌ getUserContent: No authenticated user');
    return [];
  }

  const supabase = createServerAdminClient();

  console.log('🔍 getUserContent called for user:', {
    userId: session.userId
  });

  try {
    const { data: content, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    console.log(`📄 Found ${content?.length || 0} content pieces for user ${session.userId}`);

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
  // Check authentication
  const session = await getCurrentSession();
  if (!session) {
    throw new Error('Authentication required');
  }

  const supabase = createServerAdminClient();

  try {
    const { error } = await supabase
      .from('generated_content')
      .delete()
      .eq('id', contentId)
      .eq('user_id', session.userId);

    if (error) {
      throw new Error('Failed to delete content');
    }

    console.log(`🗑️ Content deleted successfully for user ${session.userId}: ${contentId}`);

    revalidatePath('/dashboard/content');
    return { success: true };
  } catch (error) {
    console.error('Error deleting content:', error);
    throw new Error('Failed to delete content');
  }
}