/**
 * Secure Password Reset Form Component
 */

'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'
// import { createClient } from '@/lib/auth/supabase-client'

import { updatePasswordAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  csrfToken: string
  recoveryToken?: string
}

export function ResetPasswordForm({ csrfToken, recoveryToken }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // const [clientSession, setClientSession] = useState<any>(null)
  // const [sessionChecked, setSessionChecked] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Check client-side session on mount
  // useEffect(() => {
  //   async function checkClientSession() {
  //     const supabase = createClient()
  //     const { data: { session } } = await supabase.auth.getSession()
  //     setClientSession(session)
  //     setSessionChecked(true)
      
  //     if (session?.user) {
  //       console.log('Client-side session found for user: [REDACTED]')
  //     } else {
  //       console.log('No client-side session found')
  //     }
  //   }

  //   checkClientSession()
  // }, [])

  const password = form.watch('password')

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, feedback: [] }
    
    let score = 0
    const feedback = []
    
    if (password.length >= 8) score += 25
    else feedback.push('At least 8 characters')
    
    if (/[a-z]/.test(password)) score += 25
    else feedback.push('One lowercase letter')
    
    if (/[A-Z]/.test(password)) score += 25
    else feedback.push('One uppercase letter')
    
    if (/\d/.test(password)) score += 25
    else feedback.push('One number')
    
    return { score, feedback }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = (data: ResetPasswordFormData) => {
    startTransition(async () => {
      setError(null)

      const formData = new FormData()
      formData.append('password', data.password)
      formData.append('confirmPassword', data.confirmPassword)
      formData.append('csrf-token', csrfToken)
      
      // Include recovery token if available
      if (recoveryToken) {
        formData.append('recovery-token', recoveryToken)
      }

      try {
        const result = await updatePasswordAction(formData)
        
        if (!result.success) {
          setError(result.error)
          
          // Focus the field with the error
          if (result.field && form.setFocus) {
            form.setFocus(result.field as keyof ResetPasswordFormData)
          }
          
          toast.error(result.error)
        } else {
          toast.success('Password updated successfully!')
          // The action will handle the redirect
        }
      } catch (err) {
        // Don't show error for successful redirects
        if (err instanceof Error && err.digest?.startsWith('NEXT_REDIRECT')) {
          return
        }
        
        console.error('Password reset error:', err)
        setError('An unexpected error occurred. Please try again.')
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      disabled={isPending}
                      autoComplete="new-password"
                      className="pr-12"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-accent/10"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={passwordStrength.score} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {passwordStrength.score < 50 ? 'Weak' : 
                           passwordStrength.score < 75 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                      
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Still need: {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    disabled={isPending}
                    autoComplete="new-password"
                    className="pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-accent/10"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <p className="font-medium mb-1">Password requirements:</p>
          <ul className="space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains uppercase and lowercase letters</li>
            <li>• Contains at least one number</li>
          </ul>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isPending || passwordStrength.score < 100}
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Update password
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}