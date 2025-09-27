import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Target, Users, DollarSign, CheckCircle } from "lucide-react";
import { ValidationForm } from "@/components/features/validation/validation-form";
import { createServerSupabaseClient } from '@/lib/auth/supabase-server';

export default async function ValidationPage() {
  const supabase = await createServerSupabaseClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validationStats = {
    ideasValidated: 0,
    averageMarketSize: '-',
    potentialUsers: '-',
    revenueEstimate: '-'
  };

  if (user) {
    // Fetch actual validation statistics
    const { data: validatedIdeas } = await supabase
      .from('startup_ideas')
      .select('market_analysis')
      .eq('user_id', user.id)
      .eq('is_validated', true);

    if (validatedIdeas && validatedIdeas.length > 0) {
      validationStats.ideasValidated = validatedIdeas.length;

      // Calculate average market size from validated ideas
      const marketSizes = validatedIdeas
        .filter(idea => (idea.market_analysis as any)?.market_size?.tam)
        .map(idea => (idea.market_analysis as any).market_size.tam);

      if (marketSizes.length > 0) {
        const avgMarketSize = marketSizes.reduce((sum, size) => sum + size, 0) / marketSizes.length;
        validationStats.averageMarketSize = `$${(avgMarketSize / 1000000).toFixed(1)}M`;
      }

      // Calculate potential users from validated ideas
      const userEstimates = validatedIdeas
        .filter(idea => (idea.market_analysis as any)?.market_size?.sam)
        .map(idea => (idea.market_analysis as any).market_size.sam);

      if (userEstimates.length > 0) {
        const avgUsers = userEstimates.reduce((sum, users) => sum + users, 0) / userEstimates.length;
        validationStats.potentialUsers = avgUsers > 1000000
          ? `${(avgUsers / 1000000).toFixed(1)}M`
          : `${Math.round(avgUsers / 1000)}K`;
      }

      // Calculate revenue estimate from validated ideas
      const revenueEstimates = validatedIdeas
        .filter(idea => (idea.market_analysis as any)?.revenue_potential?.monthly)
        .map(idea => (idea.market_analysis as any).revenue_potential.monthly);

      if (revenueEstimates.length > 0) {
        const avgRevenue = revenueEstimates.reduce((sum, rev) => sum + rev, 0) / revenueEstimates.length;
        validationStats.revenueEstimate = avgRevenue > 1000
          ? `$${Math.round(avgRevenue / 1000)}K`
          : `$${Math.round(avgRevenue)}`;
      }
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Idea Validation"
        description="Validate your startup ideas with AI-powered market research and analysis"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ideas Validated</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationStats.ideasValidated}</div>
            <p className="text-xs text-muted-foreground">Total validated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationStats.averageMarketSize}</div>
            <p className="text-xs text-muted-foreground">Average TAM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationStats.potentialUsers}</div>
            <p className="text-xs text-muted-foreground">Estimated reach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationStats.revenueEstimate}</div>
            <p className="text-xs text-muted-foreground">Monthly estimate</p>
          </CardContent>
        </Card>
      </div>

      <ValidationForm />
    </div>
  );
}