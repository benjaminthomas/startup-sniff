'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FeatureIcons } from '@/lib/icons'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: FeatureIcons.Dashboard,
  },
  {
    title: "Generate Ideas",
    href: "/dashboard/generate", 
    icon: FeatureIcons.IdeaGeneration,
  },
  {
    title: "My Ideas",
    href: "/dashboard/ideas",
    icon: FeatureIcons.Save,
  },
  {
    title: "Trends",
    href: "/dashboard/trends",
    icon: FeatureIcons.TrendAnalysis,
  },
  {
    title: "Validation",
    href: "/dashboard/validation",
    icon: FeatureIcons.MarketResearch,
  },
  {
    title: "Content",
    href: "/dashboard/content",
    icon: FeatureIcons.BlogPost,
  },
  {
    title: "Billing",
    href: "/dashboard/billing", 
    icon: FeatureIcons.Billing,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FeatureIcons.IdeaGeneration className="h-4 w-4 text-primary-foreground" />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">StartupSniff</span>
              <span className="text-xs text-muted-foreground">AI Ideas & Validation</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FeatureIcons.Info className="h-3 w-3" />
            {state !== "collapsed" && "Need help? Contact support"}
          </div>
        </div>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}