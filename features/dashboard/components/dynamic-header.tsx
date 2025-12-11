'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DynamicHeaderProps {
  user?: {
    id: string;
    email: string | null;
    full_name: string | null;
    plan_type?: string;
  };
}

// Breadcrumb configuration for different routes
const breadcrumbConfig: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Overview' }
  ],
  '/dashboard/generate': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Generate Ideas' }
  ],
  '/dashboard/ideas': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Ideas' }
  ],
  '/dashboard/trends': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Trends' }
  ],
  '/dashboard/validation': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Validation' }
  ],
  '/dashboard/content': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Content' }
  ],
  '/dashboard/billing': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Billing' }
  ],
  '/dashboard/opportunities': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Opportunities' }
  ],
  '/dashboard/conversations': [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Conversations' }
  ],
};

// Generate breadcrumbs based on pathname
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Check static config first
  if (breadcrumbConfig[pathname]) {
    return breadcrumbConfig[pathname];
  }

  // Handle dynamic opportunity routes
  const opportunityDetailMatch = pathname.match(/^\/dashboard\/opportunities\/([^/]+)$/);
  if (opportunityDetailMatch) {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Opportunities', href: '/dashboard/opportunities' },
      { label: 'Opportunity Detail' }
    ];
  }

  // Handle opportunity contacts route
  const opportunityContactsMatch = pathname.match(/^\/dashboard\/opportunities\/([^/]+)\/contacts$/);
  if (opportunityContactsMatch) {
    const opportunityId = opportunityContactsMatch[1];
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Opportunities', href: '/dashboard/opportunities' },
      { label: 'Opportunity', href: `/dashboard/opportunities/${opportunityId}` },
      { label: 'Contacts' }
    ];
  }

  // Fallback to dashboard
  return breadcrumbConfig['/dashboard'];
}

export function DynamicHeader({ user }: DynamicHeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return <Header user={user} breadcrumbs={breadcrumbs} />;
}