-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'inactive', 'cancelled');
CREATE TYPE plan_type AS ENUM ('explorer', 'founder', 'growth');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_status subscription_status DEFAULT 'trial',
    plan_type plan_type DEFAULT 'explorer',
    stripe_customer_id TEXT UNIQUE,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT NOT NULL,
    status subscription_status DEFAULT 'trial',
    plan_type plan_type NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions 
    FOR SELECT USING (auth.uid() = user_id);

-- Usage limits table
CREATE TABLE public.usage_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_type plan_type NOT NULL,
    ideas_generated INTEGER DEFAULT 0,
    validations_completed INTEGER DEFAULT 0,
    monthly_limit_ideas INTEGER NOT NULL,
    monthly_limit_validations INTEGER NOT NULL,
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, plan_type)
);

-- Enable RLS
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_limits
CREATE POLICY "Users can view own usage limits" ON public.usage_limits 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage limits" ON public.usage_limits 
    FOR UPDATE USING (auth.uid() = user_id);

-- Startup ideas table
CREATE TABLE public.startup_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    target_market JSONB NOT NULL, -- {demographic, size, pain_level}
    solution JSONB NOT NULL, -- {value_proposition, features[], business_model}
    market_analysis JSONB NOT NULL, -- {competition_level, timing, barriers}
    implementation JSONB NOT NULL, -- {complexity, mvp, time_to_market}
    success_metrics JSONB NOT NULL, -- {probability_score, risk_factors[]}
    ai_confidence_score INTEGER CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100),
    source_data JSONB, -- Reddit posts, trends data
    is_validated BOOLEAN DEFAULT FALSE,
    validation_data JSONB, -- Market validation results
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.startup_ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for startup_ideas
CREATE POLICY "Users can view own startup ideas" ON public.startup_ideas 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own startup ideas" ON public.startup_ideas 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own startup ideas" ON public.startup_ideas 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own startup ideas" ON public.startup_ideas 
    FOR DELETE USING (auth.uid() = user_id);

-- Content generation table
CREATE TABLE public.generated_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    startup_idea_id UUID REFERENCES public.startup_ideas(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'tweet', 'email', 'landing_page')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    brand_voice TEXT, -- technical, growth_hacker, etc.
    seo_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_content
CREATE POLICY "Users can view own generated content" ON public.generated_content 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated content" ON public.generated_content 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generated content" ON public.generated_content 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated content" ON public.generated_content 
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_usage_limits_user_id ON public.usage_limits(user_id);
CREATE INDEX idx_startup_ideas_user_id ON public.startup_ideas(user_id);
CREATE INDEX idx_startup_ideas_created_at ON public.startup_ideas(created_at DESC);
CREATE INDEX idx_startup_ideas_is_favorite ON public.startup_ideas(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX idx_generated_content_idea_id ON public.generated_content(startup_idea_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at BEFORE UPDATE ON public.usage_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_startup_ideas_updated_at BEFORE UPDATE ON public.startup_ideas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON public.generated_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    
    -- Create default usage limits for explorer plan
    INSERT INTO public.usage_limits (user_id, plan_type, monthly_limit_ideas, monthly_limit_validations)
    VALUES (NEW.id, 'explorer', 3, 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile and usage limits on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();