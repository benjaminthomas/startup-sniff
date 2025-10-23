'use client';

import { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {children}
    </div>
  );
}
