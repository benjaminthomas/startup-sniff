'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Global loading state with event listeners
let globalLoadingState = false;
const listeners = new Set<() => void>();

export const setGlobalLoading = (loading: boolean) => {
  globalLoadingState = loading;
  listeners.forEach(callback => callback());
};

export const getGlobalLoading = () => globalLoadingState;

export const useGlobalLoading = (): boolean => {
  // Initialize with false to prevent hydration mismatches
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setIsLoading(globalLoadingState);
    
    const callback = () => setIsLoading(globalLoadingState);
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, []);

  // Don't show loading state until component has mounted to prevent hydration issues
  return hasMounted ? isLoading : false;
};

export function ProgressBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Only start loading if we're actually navigating
    // For now, just ensure loading is false by default
    setGlobalLoading(false);

    return () => {
      setLoading(false);
      setProgress(0);
      setGlobalLoading(false);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background">
      <div
        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}