'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateIdea } from '@/server/actions/ideas';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
  'Food & Beverage', 'Transportation', 'Real Estate', 'Entertainment',
  'Sustainability', 'Fashion', 'Travel', 'Fitness', 'Other'
];

const problemAreas = [
  'Productivity', 'Communication', 'Health & Wellness', 'Environment',
  'Education', 'Finance', 'Small Business', 'Remote Work', 'Social Impact',
  'Entertainment', 'Shopping', 'Transportation', 'Security', 'Other'
];

const audiences = [
  'Small Business Owners', 'Students', 'Professionals', 'Parents',
  'Seniors', 'Millennials', 'Gen Z', 'Developers', 'Entrepreneurs',
  'Healthcare Workers', 'Teachers', 'Remote Workers', 'Other'
];

export function IdeaGenerationForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsGenerating(true);
    setError('');
    setGeneratedIdea(null);

    // Show loading toast
    const loadingToast = toast.loading("🤖 AI is analyzing market trends and creating your startup idea...");

    try {
      const result = await generateIdea(formData);
      
      if (result.success && result.idea) {
        setGeneratedIdea(result.idea);
        toast.success(`✨ Created "${result.idea.title}" - Check out the details below!`, { 
          id: loadingToast 
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate idea';
      setError(errorMessage);
      toast.error(errorMessage, { 
        id: loadingToast 
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleViewAllIdeas = () => {
    router.push('/dashboard/ideas');
  };

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry (Optional)</Label>
            <Select name="industry">
              <SelectTrigger>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry.toLowerCase()}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="problemArea">Problem Area (Optional)</Label>
            <Select name="problemArea">
              <SelectTrigger>
                <SelectValue placeholder="What problem to solve?" />
              </SelectTrigger>
              <SelectContent>
                {problemAreas.map((area) => (
                  <SelectItem key={area} value={area.toLowerCase()}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
            <Select name="targetAudience">
              <SelectTrigger>
                <SelectValue placeholder="Who will you serve?" />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience} value={audience.toLowerCase()}>
                    {audience}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Range (Optional)</Label>
            <Select name="budget">
              <SelectTrigger>
                <SelectValue placeholder="How much can you invest?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low ($0 - $10K)</SelectItem>
                <SelectItem value="medium">Medium ($10K - $100K)</SelectItem>
                <SelectItem value="high">High ($100K+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">Time to Market (Optional)</Label>
            <Select name="timeframe">
              <SelectTrigger>
                <SelectValue placeholder="When do you want to launch?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Quick (0-6 months)</SelectItem>
                <SelectItem value="medium">Medium (6-18 months)</SelectItem>
                <SelectItem value="long">Long-term (18+ months)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userPrompt">Additional Context (Optional)</Label>
          <Textarea
            name="userPrompt"
            placeholder="Tell us more about your background, interests, or specific requirements..."
            className="min-h-20"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Your Idea...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Startup Idea
            </>
          )}
        </Button>
      </form>

      {generatedIdea && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-primary">{generatedIdea.title}</span>
              <Badge variant="secondary">New</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{generatedIdea.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-foreground">Target Market:</span>
                <p className="text-muted-foreground mt-1">{generatedIdea.target_market}</p>
              </div>
              <div>
                <span className="font-semibold text-foreground">Revenue Model:</span>
                <p className="text-muted-foreground mt-1">
                  {generatedIdea.revenue_models?.join(', ') || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={handleViewAllIdeas}
                className="flex-1"
              >
                View Full Details
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedIdea(null)}
              >
                Generate Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}