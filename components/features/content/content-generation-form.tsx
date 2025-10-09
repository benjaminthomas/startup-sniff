'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Lightbulb, Sparkles, Crown, Plus } from "lucide-react";
import { generateContent } from '@/modules/content';
import { useServerPlanLimits } from '@/lib/hooks/use-server-plan-limits';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { CONTENT_TEMPLATES } from '@/constants';
import { toast } from 'sonner';

interface StartupIdea {
  id: string;
  title: string;
  problem_statement: string;
  target_market: {
    primary: string;
    secondary?: string;
    demographics?: Record<string, unknown>;
  };
  solution: {
    description: string;
    features?: string[];
    tech_requirements?: Record<string, unknown>;
  };
}

interface ContentGenerationFormProps {
  userIdeas?: StartupIdea[];
}

export function ContentGenerationForm({ userIdeas = [] }: ContentGenerationFormProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    contentType: '',
    tone: '',
    topic: '',
    keyPoints: '',
    targetAudience: '',
    startupIdea: '',
    template: '',
  });

  const { isAtLimit, getRemainingLimit, planType, usage, refreshUsage } = useServerPlanLimits();

  // Auto-populate form when an idea is selected
  useEffect(() => {
    if (selectedIdea && userIdeas.length > 0) {
      const idea = userIdeas.find(i => i.id === selectedIdea);
      if (idea) {
        setFormData(prev => ({
          ...prev,
          topic: idea.title,
          keyPoints: idea.problem_statement,
          targetAudience: ((idea.target_market as Record<string, unknown>)?.description || (idea.target_market as Record<string, unknown>)?.demographic || '') as string,
          startupIdea: `Title: ${idea.title}\nProblem: ${idea.problem_statement}\nSolution: ${(idea.solution as Record<string, unknown>)?.description || ''}\nTarget Market: ${(idea.target_market as Record<string, unknown>)?.description || ''}`
        }));
      }
    }
  }, [selectedIdea, userIdeas]);

  // Auto-populate form when a template is selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== 'custom') {
      const template = CONTENT_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        setFormData(prev => ({
          ...prev,
          contentType: template.type,
          template: selectedTemplate,
          topic: template.preview.includes('[Product]') || template.preview.includes('[Startup]') ? 
                 (prev.startupIdea ? prev.topic : template.preview) : template.preview,
          keyPoints: template.description
        }));
      }
    } else if (selectedTemplate === 'custom') {
      setFormData(prev => ({
        ...prev,
        template: 'custom'
      }));
    }
  }, [selectedTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check plan limits first
    if (isAtLimit('content')) {
      setShowUpgradeModal(true);
      return;
    }
    
    if (!selectedIdea) {
      toast.error('Please select a startup idea to base your content on');
      return;
    }

    if (!formData.contentType || !formData.topic) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsGenerating(true);
    
    // Show loading toast with detailed message
    const loadingToast = toast.loading("🤖 AI is crafting your content... This may take a moment");
    
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });

      const result = await generateContent(formDataObj);
      
      if (result.success) {
        toast.success("✨ Content generated successfully!", {
          id: loadingToast
        });
        
        // Reset form
        setFormData({
          contentType: '',
          tone: '',
          topic: '',
          keyPoints: '',
          targetAudience: '',
          startupIdea: '',
          template: '',
        });
        setSelectedIdea('');
        setSelectedTemplate('');
        
        // Refresh usage and reload page to show updated stats and content
        await refreshUsage();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate content. Please try again.",
        { id: loadingToast }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const remainingContent = getRemainingLimit('content');
  const isContentAtLimit = isAtLimit('content');

  // Show empty state if no generated ideas
  if (userIdeas.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Generated Ideas Found</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Content generation works with your AI-generated startup ideas. Generate some ideas first to create compelling marketing content.
          </p>
          <Button onClick={() => router.push('/dashboard/generate')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Generate Ideas First
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-900/30 dark:to-blue-900/30 py-0">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 rounded-t-lg py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Content Generation</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Transform your startup ideas into compelling marketing content
                </CardDescription>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {remainingContent === -1 ? (
                  <span className="text-green-600">Unlimited</span>
                ) : (
                  <span className={remainingContent > 0 ? "text-green-600" : "text-red-600"}>
                    {remainingContent} remaining
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Unlimited
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pb-4'>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Startup Idea Selector */}
            {userIdeas.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <Label className="font-medium">Base Content on Your Startup Idea</Label>
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    Smart Auto-Fill
                  </Badge>
                </div>
                <Select 
                  value={selectedIdea} 
                  onValueChange={(value) => setSelectedIdea(value)}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-950">
                    <SelectValue placeholder="Choose a startup idea to auto-populate content..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userIdeas.map((idea) => (
                      <SelectItem key={idea.id} value={idea.id} className="group focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{idea.title}</span>
{(() => {
                            if (!idea.target_market) return null;
                            
                            let targetText = '';
                            if (typeof idea.target_market === 'string') {
                              targetText = idea.target_market;
                            } else {
                              targetText = (idea.target_market as Record<string, unknown>)?.description as string ||
                                         (idea.target_market as Record<string, unknown>)?.demographic as string ||
                                         (idea.target_market as Record<string, unknown>)?.primary_demographic as string ||
                                         '';
                            }
                            
                            if (!targetText || targetText.trim() === '') {
                              return null; // Don't show badge if no meaningful content
                            }
                            
                            const displayText = targetText.slice(0, 20) + (targetText.length > 20 ? '...' : '');
                            
                            return (
                              <Badge variant="outline" className="text-xs group-hover:text-white group-hover:bg-transparent group-hover:border-white/50 group-focus:text-white group-focus:bg-transparent group-focus:border-white/50 group-data-[state=checked]:text-black group-data-[state=checked]:bg-white group-data-[state=checked]:border-black/30 group-aria-[selected=true]:text-black group-aria-[selected=true]:bg-white group-aria-[selected=true]:border-black/30">
                                {displayText}
                              </Badge>
                            );
                          })()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedIdea && (
                  <div className="mt-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Content will be automatically tailored to your selected startup idea
                  </div>
                )}
              </div>
            )}

            {/* Content Template Selector */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <Label className="font-medium">Choose a Content Template</Label>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {CONTENT_TEMPLATES.length} Available
                </Badge>
              </div>
              <Select 
                value={selectedTemplate} 
                onValueChange={(value) => setSelectedTemplate(value)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-950">
                  <SelectValue placeholder="Select a template or create custom content..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">🎨 Custom Content (no template)</SelectItem>
                  {CONTENT_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="group focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        <Badge variant="outline" className="text-xs group-hover:text-white group-hover:bg-transparent group-hover:border-white/50 group-focus:text-white group-focus:bg-transparent group-focus:border-white/50 group-data-[state=checked]:text-black group-data-[state=checked]:bg-white group-data-[state=checked]:border-black/30 group-aria-[selected=true]:text-black group-aria-[selected=true]:bg-white group-aria-[selected=true]:border-black/30">
                          {template.type === 'blog_post' ? 'Blog' : 
                           template.type === 'tweet' ? 'Twitter' : 
                           template.type === 'email' ? 'Email' : 'Landing'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && selectedTemplate !== 'custom' && (
                <div className="mt-2">
                  {(() => {
                    const template = CONTENT_TEMPLATES.find(t => t.id === selectedTemplate);
                    return template ? (
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <div className="font-medium mb-1">📝 {template.description}</div>
                        <div className="text-blue-600 dark:text-blue-400 italic">
                          Preview: {template.preview}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type *</Label>
              <Select 
                value={formData.contentType} 
                onValueChange={(value) => handleInputChange('contentType', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blog_post">Blog Post</SelectItem>
                  <SelectItem value="tweet">Twitter Thread</SelectItem>
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="landing_page">Landing Page Copy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone & Style</Label>
              <Select 
                value={formData.tone} 
                onValueChange={(value) => handleInputChange('tone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="exciting">Exciting</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic/Subject *</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              placeholder="What do you want to write about?"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-points">Key Points</Label>
            <Textarea
              id="key-points"
              value={formData.keyPoints}
              onChange={(e) => handleInputChange('keyPoints', e.target.value)}
              placeholder="List the main points you want to cover..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience</Label>
            <Input
              id="target-audience"
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              placeholder="Who is this content for?"
              maxLength={200}
            />
          </div>

          {/* Enhanced Submit Button */}
          <div className="space-y-3">
            <Button 
              type="submit" 
              variant={isContentAtLimit ? "default" : "default"}
              className={`w-full h-12 text-base font-medium ${
                isContentAtLimit 
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" 
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
              }`}
              disabled={isGenerating || (!formData.contentType || !formData.topic)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>AI is Creating Magic...</span>
                </>
              ) : isContentAtLimit ? (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  <span>Upgrade to Generate More Content</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  <span>Generate {selectedIdea ? 'Personalized' : 'AI'} Content</span>
                </>
              )}
            </Button>
            
            {/* Status Messages */}
            <div className="text-center space-y-1">
              {isGenerating ? (
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  🎨 Crafting compelling content tailored to your audience...
                </p>
              ) : isContentAtLimit ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-1">
                    🚀 Content limit reached for {planType} plan
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Upgrade to generate more marketing content for your startup ideas
                  </p>
                </div>
              ) : remainingContent <= 2 && remainingContent !== -1 ? (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    ⚡ Only {remainingContent} content generations left this month
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ✨ AI will create professional, engaging content in seconds
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>

    <UpgradeModal
      isVisible={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      featureType="content"
      currentPlan={planType}
      usedCount={usage.content_used || 0}
      limitCount={-1} // Pro plans have unlimited
    />
    </>
  );
}