'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, Heart, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  totalIdeas: number;
  validatedIdeas: number;
  favoriteIdeas: number;
  planType: string;
}

export function StatsCards({ totalIdeas, validatedIdeas, favoriteIdeas, planType }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Ideas",
      value: totalIdeas,
      icon: Lightbulb,
      description: "Ideas generated this month"
    },
    {
      title: "Validated Ideas",
      value: validatedIdeas,
      icon: TrendingUp,
      description: "Market validated opportunities"
    },
    {
      title: "Favorite Ideas",
      value: favoriteIdeas,
      icon: Heart,
      description: "Ideas you've favorited"
    },
    {
      title: "Success Rate",
      value: totalIdeas > 0 ? Math.round((validatedIdeas / totalIdeas) * 100) : 0,
      icon: Target,
      description: "Validation success rate",
      suffix: "%"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value}{stat.suffix || ''}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}