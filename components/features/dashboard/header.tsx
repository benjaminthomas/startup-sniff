"use client";

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
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

export function Header({ breadcrumbs = [] }: HeaderProps) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="hidden sm:block">
        {breadcrumbs.length > 0 && (
          <Breadcrumb className="text-sm text-muted-foreground">
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

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-white/60 bg-white/80 text-muted-foreground shadow-sm backdrop-blur transition-all hover:bg-white hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
