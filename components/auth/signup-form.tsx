/**
 * Secure Sign Up Form Component
 */

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { signUpAction } from '@/modules/auth'
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

const signUpSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),
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

type SignUpFormData = z.infer<typeof signUpSchema>

interface SignUpFormProps {
  csrfToken: string
}

export function SignUpForm({ csrfToken }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

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

  const onSubmit = (data: SignUpFormData) => {
    startTransition(async () => {
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('password', data.password)
      formData.append('csrf-token', csrfToken)

      try {
        const result = await signUpAction(formData)
        
        if (!result.success) {
          setError(result.error || 'An error occurred')
          toast.error(result.error)
        } else {
          setSuccess(result.message || 'Account created successfully!')
          toast.success('Account created! Please check your email.')
          form.reset()
        }
      } catch {
        setError('An unexpected error occurred. Please try again.')
        toast.error('An unexpected error occurred. Please try again.')
      }
    })
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mx-auto">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground mt-2">
            We&apos;ve sent a confirmation email to verify your account.
            Please check your inbox and click the verification link to complete your registration.
          </p>
        </div>
        <div className="pt-4">
          <Button 
            variant="outline" 
            onClick={() => setSuccess(null)} 
            className="w-full"
          >
            Back to Signup
          </Button>
        </div>
      </div>
    )
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Enter your full name"
                  disabled={isPending}
                  autoComplete="name"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter your email address"
                  disabled={isPending}
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      disabled={isPending}
                      autoComplete="new-password"
                      className="pr-12"
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isPending || !form.formState.isValid}
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </Form>
  )
}
