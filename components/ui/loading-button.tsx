'use client';

import { useState, useTransition } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger/client'

interface LoadingButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => Promise<void> | void;
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

export function LoadingButton({
  children,
  onClick,
  loadingText = 'Processing...',
  successMessage,
  errorMessage,
  showToast = false,
  disabled,
  ...props
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    if (!onClick) return;

    setIsLoading(true);
    let loadingToast: string | number | undefined;

    if (showToast) {
      loadingToast = toast.loading(loadingText);
    }

    try {
      if (onClick.constructor.name === 'AsyncFunction') {
        await onClick();
      } else {
        startTransition(() => {
          onClick();
        });
      }

      if (showToast && successMessage) {
        toast.success(successMessage, { id: loadingToast });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : (errorMessage || 'An error occurred');
      
      if (showToast) {
        toast.error(message, { id: loadingToast });
      }
      
      log.error('LoadingButton error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || isPending;

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}