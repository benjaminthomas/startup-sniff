/**
 * Toast Hook
 * Wrapper around sonner for consistent toast notifications
 */

import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 3000 }: ToastOptions) => {
    const message = title || description || ''
    const secondaryMessage = title && description ? description : undefined

    if (variant === 'destructive') {
      sonnerToast.error(message, {
        description: secondaryMessage,
        duration,
      })
    } else {
      sonnerToast.success(message, {
        description: secondaryMessage,
        duration,
      })
    }
  }

  return { toast }
}
