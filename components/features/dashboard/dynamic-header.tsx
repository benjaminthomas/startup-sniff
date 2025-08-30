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
};

export function DynamicHeader({ user }: DynamicHeaderProps) {
  const pathname = usePathname();
  
  // Get breadcrumbs for current route, fallback to dashboard
  const breadcrumbs = breadcrumbConfig[pathname] || breadcrumbConfig['/dashboard'];
  
  return <Header user={user} breadcrumbs={breadcrumbs} />;
}