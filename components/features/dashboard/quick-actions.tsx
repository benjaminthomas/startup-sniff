'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      title: "Generate Ideas",
      description: "Create AI-powered startup ideas",
      icon: Lightbulb,
      href: "/dashboard/generate",
      color: "bg-primary",
    },
    {
      title: "Analyze Trends",
      description: "Explore Reddit trends",
      icon: TrendingUp,
      href: "/dashboard/trends",
      color: "bg-accent",
    },
    {
      title: "Validate Ideas",
      description: "Market research & validation",
      icon: BarChart3,
      href: "/dashboard/validation",
      color: "bg-primary",
    },
    {
      title: "Generate Content",
      description: "Create marketing content",
      icon: FileText,
      href: "/dashboard/content",
      color: "bg-accent",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump into your most common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-primary/5 hover:border-primary/20 hover:shadow-md transition-all duration-200 hover:text-foreground"
              asChild
            >
              <Link href={action.href}>
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm whitespace-normal">{action.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-normal leading-relaxed">{action.description}</div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}