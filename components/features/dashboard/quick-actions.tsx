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
      gradient: "from-[#7C3AED22] via-[#8B5CF622] to-[#22D3EE22]",
      glow: "shadow-[0px_10px_26px_-16px_rgba(124,58,237,0.4)]",
      iconBg: "from-primary to-sky-500",
    },
    {
      title: "Analyze Trends",
      description: "Explore Reddit trends",
      icon: TrendingUp,
      href: "/dashboard/trends",
      gradient: "from-[#38BDF822] via-[#22D3EE22] to-[#7C3AED22]",
      glow: "shadow-[0px_10px_26px_-16px_rgba(14,165,233,0.35)]",
      iconBg: "from-sky-500 to-blue-500",
    },
    {
      title: "Validate Ideas",
      description: "Market research & validation",
      icon: BarChart3,
      href: "/dashboard/validation",
      gradient: "from-[#22C55E22] via-[#34D39922] to-[#7C3AED22]",
      glow: "shadow-[0px_10px_26px_-16px_rgba(34,197,94,0.35)]",
      iconBg: "from-emerald-500 to-teal-500",
    },
    {
      title: "Generate Content",
      description: "Create marketing content",
      icon: FileText,
      href: "/dashboard/content",
      gradient: "from-[#F472B622] via-[#FBCFE822] to-[#7C3AED22]",
      glow: "shadow-[0px_10px_26px_-16px_rgba(236,72,153,0.35)]",
      iconBg: "from-pink-500 to-fuchsia-500",
    },
  ];

  return (
    <Card className="border-none bg-white/90 shadow-[0px_12px_32px_-22px_rgba(124,58,237,0.28)] backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-1 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Jump into your most common tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={cn(
                "group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/60 bg-white/85 p-4 transition-all duration-300",
                "hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                action.glow
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-300 group-hover:opacity-95",
                  action.gradient
                )}
                aria-hidden="true"
              />
              <div className="relative z-10 flex items-center justify-between">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md shadow-black/10",
                    action.iconBg
                  )}
                >
                  <action.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="relative z-10 space-y-1">
                <div className="text-sm font-semibold text-foreground">
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
