'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { BarChart3, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { validateIdea } from '@/lib/actions/validation'
import { usePlanLimits } from '@/lib/hooks/use-plan-limits'

export function ValidationForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { getRemainingLimit, isAtLimit } = usePlanLimits()

  const remainingValidations = getRemainingLimit('validations')
  const isValidationLimited = isAtLimit('validations')

  const handleSubmit = async (formData: FormData) => {
    if (isValidationLimited) {
      setError('You have reached your monthly validation limit. Please upgrade your plan.')
      return
    }

    startTransition(async () => {
      setError(null)
      setSuccess(null)
      setProgress(0)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 500)

      try {
        const result = await validateIdea(formData)
        
        clearInterval(progressInterval)
        setProgress(100)

        if (result.success && result.ideaId) {
          setSuccess('Idea validated successfully! Redirecting to your validated idea...')
          setTimeout(() => {
            router.push(`/dashboard/ideas/${result.ideaId}`)
          }, 2000)
        } else {
          setError(result.error || 'Failed to validate idea')
        }
      } catch (error) {
        clearInterval(progressInterval)
        setError(error instanceof Error ? error.message : 'Something went wrong')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Validate Your Idea
        </CardTitle>
        <CardDescription>
          Get comprehensive AI-powered market analysis and validation insights for your startup idea
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Limits Info */}
        {remainingValidations >= 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              {isValidationLimited 
                ? 'You have reached your monthly validation limit. Upgrade your plan for more validations.'
                : `You have ${remainingValidations === -1 ? 'unlimited' : remainingValidations} validation${remainingValidations === 1 ? '' : 's'} remaining this month.`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isPending && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Analyzing your idea...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Validation Form */}
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ideaTitle">Idea Title *</Label>
            <Input
              id="ideaTitle"
              name="ideaTitle"
              placeholder="Enter your startup idea title"
              required
              disabled={isPending}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              A clear, concise title for your startup idea
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ideaDescription">Idea Description *</Label>
            <Textarea
              id="ideaDescription"
              name="ideaDescription"
              placeholder="Describe your startup idea in detail. What problem does it solve? How does it work? What makes it unique?"
              rows={4}
              required
              disabled={isPending}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Detailed description of your idea, problem it solves, and unique value proposition
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetMarket">Target Market *</Label>
            <Input
              id="targetMarket"
              name="targetMarket"
              placeholder="Who is your target audience? (e.g., small business owners, college students, remote workers)"
              required
              disabled={isPending}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Describe your primary target audience and market segment
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending || isValidationLimited}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating Idea...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                {isValidationLimited ? 'Upgrade to Validate' : 'Validate Idea'}
              </>
            )}
          </Button>
        </form>

        {/* What's Included */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            What's included in validation:
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground ml-6">
            <li>• Market size analysis (TAM, SAM, SOM)</li>
            <li>• Target audience demographics and personas</li>
            <li>• Competitive landscape assessment</li>
            <li>• Implementation feasibility analysis</li>
            <li>• Risk assessment and success probability</li>
            <li>• Revenue potential estimation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}