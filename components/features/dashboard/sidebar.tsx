'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  Lightbulb,
  TrendingUp,
  BarChart3,
  FileText,
  CreditCard,
  Menu,
  X
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Generate Ideas",
    href: "/dashboard/generate",
    icon: Lightbulb,
  },
  {
    title: "My Ideas",
    href: "/dashboard/ideas",
    icon: Lightbulb,
  },
  {
    title: "Trends",
    href: "/dashboard/trends",
    icon: TrendingUp,
  },
  {
    title: "Validation",
    href: "/dashboard/validation",
    icon: BarChart3,
  },
  {
    title: "Content",
    href: "/dashboard/content",
    icon: FileText,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-background",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl">StartupSniff</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-accent hover:text-accent-foreground"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isCollapsed ? "h-10 w-10 p-0" : "h-10 px-4 py-2",
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}