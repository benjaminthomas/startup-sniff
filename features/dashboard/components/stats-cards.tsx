'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Target, Heart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalIdeas: number;
  validatedIdeas: number;
  favoriteIdeas: number;
  planType: string;
}

export function StatsCards({ totalIdeas, validatedIdeas, favoriteIdeas }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Ideas",
      value: totalIdeas,
      icon: Lightbulb,
      description: "Ideas generated this month",
      gradient: "from-[#7C3AED24] via-[#8B5CF624] to-[#38BDF824]",
      accent: "text-primary",
      iconBg: "bg-white/80 text-primary",
    },
    {
      title: "Validated Ideas",
      value: validatedIdeas,
      icon: TrendingUp,
      description: "Market validated opportunities",
      gradient: "from-[#6366F124] via-[#22D3EE24] to-[#7C3AED24]",
      accent: "text-sky-600",
      iconBg: "bg-white/80 text-sky-600",
    },
    {
      title: "Favorite Ideas",
      value: favoriteIdeas,
      icon: Heart,
      description: "Ideas you've favorited",
      gradient: "from-[#FDE68A24] via-[#F9A8D424] to-[#FBCFE824]",
      accent: "text-pink-500",
      iconBg: "bg-white/80 text-pink-500",
    },
    {
      title: "Success Rate",
      value: totalIdeas > 0 ? Math.round((validatedIdeas / totalIdeas) * 100) : 0,
      icon: Target,
      description: "Validation success rate",
      suffix: "%",
      gradient: "from-[#34D39924] via-[#4ADE8024] to-[#22C55E24]",
      accent: "text-emerald-600",
      iconBg: "bg-white/80 text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="relative overflow-hidden border border-white/80 bg-white/95 shadow-sm shadow-primary/10 backdrop-blur"
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90",
              stat.gradient
            )}
          />
          <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0 pb-2 pt-6">
            <div className="space-y-1">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
                {stat.title}
              </CardTitle>
              <div className={cn("text-3xl font-semibold leading-tight", stat.accent)}>
                {stat.value}
                {stat.suffix || ""}
              </div>
            </div>
            <div className={cn("flex size-10 items-center justify-center rounded-xl shadow-sm", stat.iconBg)}>
              <stat.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pb-6 pt-0">
            <p className="text-xs text-muted-foreground/80">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
