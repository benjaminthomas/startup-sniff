'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function QuickActions() {
  const actions = [
    {
      title: "Generate Ideas",
      description: "Create AI-powered startup ideas",
      icon: Lightbulb,
      href: "/dashboard/generate",
      iconColor: "text-[#2D6EF7]",
      iconBg: "bg-[#2D6EF7]/10",
    },
    {
      title: "Analyze Trends",
      description: "Explore Reddit trends",
      icon: TrendingUp,
      href: "/dashboard/trends",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "Validate Ideas",
      description: "Market research & validation",
      icon: BarChart3,
      href: "/dashboard/validation",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      title: "Generate Content",
      description: "Create marketing content",
      icon: FileText,
      href: "/dashboard/content",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
  ];

  return (
    <Card className="bg-white shadow-sm border-gray-100">
      <CardHeader className="flex flex-col gap-1 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Jump into your most common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#2D6EF7]/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={cn("flex size-10 items-center justify-center rounded-lg", action.iconBg)}>
                  <action.icon className={cn("h-5 w-5", action.iconColor)} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground group-hover:text-[#2D6EF7] transition-colors">
                  {action.title}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
