"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, Settings, LogOut, Crown, Zap, Target } from "lucide-react";
import { signOutAction } from "@/modules/auth/actions";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
    plan_type?: string;
  };
  breadcrumbs?: BreadcrumbItem[];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";

  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return names[0][0].toUpperCase();
}

function getPlanConfig(planType: string | undefined) {
  const plan = (planType || "free").toLowerCase();

  switch (plan) {
    case "explorer":
      return {
        name: "Explorer",
        variant: "outline" as const,
        icon: Target,
        badgeClasses:
          "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
        iconColor: "text-slate-600",
        showUpgrade: true,
      };
    case "founder":
      return {
        name: "Founder",
        variant: "default" as const,
        icon: Zap,
        badgeClasses:
          "bg-blue-500 text-white border-blue-500 hover:bg-blue-600",
        iconColor: "text-blue-100",
        showUpgrade: true,
      };
    case "growth":
      return {
        name: "Growth",
        variant: "default" as const,
        icon: Crown,
        badgeClasses:
          "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600 hover:from-purple-700 hover:to-pink-700",
        iconColor: "text-yellow-300",
        showUpgrade: false,
      };
    default:
      return {
        name: "Explorer",
        variant: "outline" as const,
        icon: Target,
        badgeClasses:
          "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100",
        iconColor: "text-slate-600",
        showUpgrade: true,
      };
  }
}

export function Header({ user, breadcrumbs = [] }: HeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const planConfig = getPlanConfig(user?.plan_type);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleUpgrade = () => {
    router.push("/dashboard/billing");
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.label} className="flex items-center">
                  <BreadcrumbItem>
                    {breadcrumb.href && index < breadcrumbs.length - 1 ? (
                      <BreadcrumbLink href={breadcrumb.href}>
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={planConfig.variant}
            className={`flex items-center gap-1.5 px-2.5 py-1 ${planConfig.badgeClasses}`}
          >
            <planConfig.icon
              className={`h-3.5 w-3.5 ${planConfig.iconColor}`}
            />
            <span className="text-xs font-medium">{planConfig.name}</span>
          </Badge>
          {planConfig.showUpgrade && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpgrade}
              className="text-xs text-muted-foreground hover:text-white hover:bg-blue-600 px-2 py-1 h-auto transition-colors"
            >
              Upgrade
            </Button>
          )}
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>

        {isMounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-gray-900 hover:text-gray-900">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "Loading..."}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4 text-current" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4 text-current" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOutAction()}>
                <LogOut className="mr-2 h-4 w-4 text-current" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
