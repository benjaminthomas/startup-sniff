'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition, type SVGProps, type ComponentType } from "react"
import { FeatureIcons } from "@/lib/icons"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings as SettingsIcon, User as UserIcon } from "lucide-react"
import { signOutAction } from "@/modules/auth/actions"

interface SidebarUser {
  id: string
  email: string | null
  full_name: string | null
  plan_type?: string
}

type SidebarNavigationItem = {
  title: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  requiresPaid?: boolean
}

interface AppSidebarProps {
  user: SidebarUser
}

const navigationSections: {
  label: string
  items: SidebarNavigationItem[]
}[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: FeatureIcons.Dashboard,
      },
    ],
  },
  {
    label: "Idea Lab",
    items: [
      {
        title: "Generate Ideas",
        href: "/dashboard/generate",
        icon: FeatureIcons.IdeaGeneration,
      },
      {
        title: "Saved Ideas",
        href: "/dashboard/ideas",
        icon: FeatureIcons.Save,
      },
    ],
  },
  {
    label: "Market Intelligence",
    items: [
      {
        title: "Opportunities",
        href: "/dashboard/opportunities",
        icon: FeatureIcons.Search,
      },
      {
        title: "My Conversations",
        href: "/dashboard/conversations",
        icon: FeatureIcons.RedditTrends,
        requiresPaid: true,
      },
      {
        title: "Trend Insights",
        href: "/dashboard/trends",
        icon: FeatureIcons.TrendAnalysis,
      },
      {
        title: "Validation Lab",
        href: "/dashboard/validation",
        icon: FeatureIcons.MarketResearch,
      },
    ],
  },
  {
    label: "Content Studio",
    items: [
      {
        title: "Content Generation",
        href: "/dashboard/content",
        icon: FeatureIcons.BlogPost,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Billing & Usage",
        href: "/dashboard/billing",
        icon: FeatureIcons.Billing,
      },
    ],
  },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return "U"

  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return parts[0][0].toUpperCase()
}

type NormalizedPlan = "free" | "founder" | "growth"

function normalizePlanType(planType?: string): NormalizedPlan {
  const plan = (planType || "free").toLowerCase()

  if (plan === "growth") return "growth"
  if (plan === "founder") return "founder"
  return "free"
}

function getPlanBadge(planType: NormalizedPlan) {
  switch (planType) {
    case "founder":
      return {
        label: "Founder",
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
      }
    case "growth":
      return {
        label: "Growth",
        className:
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      }
    default:
      return {
        label: "Free",
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
      }
  }
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const [isSigningOut, startTransition] = useTransition()
  const planType = normalizePlanType(user?.plan_type)
  const planBadge = getPlanBadge(planType)
  const displayName = user?.full_name || "Guest"
  const displayEmail = user?.email || ""

  const handleSignOut = () => {
    startTransition(() => {
      void signOutAction()
    })
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/40 bg-white/90 shadow-[0px_12px_32px_-20px_rgba(124,58,237,0.28)] backdrop-blur"
    >
      <SidebarHeader className="border-b border-white/50 px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "group relative flex w-full items-center rounded-2xl border border-border/60 bg-background text-left transition-all hover:border-border hover:bg-muted/40",
                collapsed ? "h-12 w-12 justify-center rounded-full px-0 py-0" : "gap-3 px-3 py-3"
              )}
              aria-label={collapsed ? "Open user menu" : undefined}
            >
              <Avatar className={collapsed ? "h-8 w-8" : "h-10 w-10"}>
                <AvatarFallback className="bg-primary/10 text-sm font-medium uppercase text-primary">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {planBadge.label} plan
                  </p>
                </div>
              )}
              {!collapsed && (
                <FeatureIcons.ExpandDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                {displayEmail && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                  </p>
                )}
                <p className="text-xs leading-none text-muted-foreground">
                  Plan: {planBadge.label}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 gap-0">
        {navigationSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel
              className={cn(
                "px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70",
                collapsed && "sr-only"
              )}
            >
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)
                  const isLocked = item.requiresPaid && planType === "free"
                  const upgradeUrl = item.requiresPaid
                    ? `/dashboard/billing?upgrade=true&reason=${encodeURIComponent(`Upgrade to access ${item.title}`)}`
                    : undefined
                  const tooltip =
                    collapsed && isLocked
                      ? `${item.title} · Upgrade required`
                      : collapsed
                        ? item.title
                        : undefined

                  return (
                    <SidebarMenuItem key={item.href} className="relative">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive && !isLocked}
                        tooltip={tooltip}
                        className={cn(
                          isLocked
                            ? "border border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                            : isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {isLocked ? (
                          <Link href={upgradeUrl || '/dashboard/billing'} className="flex w-full items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && (
                              <div className="flex flex-1 items-center justify-between">
                                <span className="truncate">{item.title}</span>
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                  Upgrade
                                </span>
                              </div>
                            )}
                          </Link>
                        ) : (
                          <Link href={item.href} className="group flex w-full items-center gap-3">
                            <item.icon className="h-4 w-4 transition-colors text-inherit" />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="mt-auto px-4 pb-6 pt-0">
        {!collapsed && planType === "free" && (
          <div className="rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-4 text-white shadow-lg">
            <div className="text-sm font-semibold">Upgrade to unlock more</div>
            <p className="mt-1 text-xs text-white/80">
              Access unlimited workspaces, priority support, and advanced automations.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full border-0 bg-white text-purple-600 hover:bg-white/90"
            >
              Upgrade plan
            </Button>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
