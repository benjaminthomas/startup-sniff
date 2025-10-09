"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Lightbulb,
  Plus,
} from "lucide-react";
import { validateExistingIdea } from "@/modules/validation";
import { usePlanLimits } from "@/modules/usage/hooks";
import { getUserIdeas } from "@/modules/ideas";

interface GeneratedIdea {
  id: string;
  title: string;
  problem_statement: string;
  is_validated: boolean | null;
  created_at: string;
}

export function ValidationForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("");
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { getRemainingLimit, isAtLimit } = usePlanLimits();

  const remainingValidations = getRemainingLimit("validations");
  const isValidationLimited = isAtLimit("validations");

  useEffect(() => {
    loadGeneratedIdeas();
  }, []);

  const loadGeneratedIdeas = async () => {
    try {
      const ideas = await getUserIdeas(50); // Get up to 50 ideas for validation

      // Map the ideas to the expected format
      const mappedIdeas = ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        problem_statement: idea.problem_statement,
        is_validated: idea.is_validated,
        created_at: idea.created_at,
      }));

      setGeneratedIdeas(mappedIdeas);
    } catch (err) {
      console.error("Error loading ideas:", err);
      setError("Failed to load your generated ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isValidationLimited) {
      setError(
        "You have reached your monthly validation limit. Please upgrade your plan."
      );
      return;
    }

    if (!selectedIdeaId) {
      setError("Please select an idea to validate.");
      return;
    }

    startTransition(async () => {
      setError(null);
      setSuccess(null);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      try {
        const result = await validateExistingIdea(selectedIdeaId);

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success) {
          setSuccess(
            "Idea validated successfully! Redirecting to your validated idea..."
          );
          setTimeout(() => {
            router.push(`/dashboard/ideas/${selectedIdeaId}`);
          }, 2000);
        } else {
          setError(result.error || "Failed to validate idea");
        }
      } catch (error) {
        clearInterval(progressInterval);
        setError(
          error instanceof Error ? error.message : "Something went wrong"
        );
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading your generated ideas...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Validate Generated Ideas
        </CardTitle>
        <CardDescription>
          Select from your AI-generated ideas to get comprehensive market
          analysis and validation insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Validation Limits Info */}
        {remainingValidations >= 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              {isValidationLimited
                ? "You have reached your monthly validation limit. Upgrade your plan for more validations."
                : `You have ${
                    remainingValidations === -1
                      ? "unlimited"
                      : remainingValidations
                  } validation${
                    remainingValidations === 1 ? "" : "s"
                  } remaining this month.`}
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
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
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

        {/* Generated Ideas List */}
        {generatedIdeas.length > 0 ? (
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Select an idea to validate:
            </Label>
            {generatedIdeas.filter((idea) => !idea.is_validated).length ===
            0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Ideas Validated!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You&aposve validated all your generated ideas. Generate more
                  ideas to validate them.
                </p>
                <Button
                  onClick={() => router.push("/dashboard/generate")}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Generate More Ideas
                </Button>
              </div>
            ) : (
              <RadioGroup
                value={selectedIdeaId}
                onValueChange={setSelectedIdeaId}
              >
                {generatedIdeas
                  .filter((idea) => !idea.is_validated)
                  .map((idea) => (
                    <div
                      key={idea.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <RadioGroupItem
                        value={idea.id}
                        id={idea.id}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={idea.id}
                            className="font-medium cursor-pointer"
                          >
                            {idea.title}
                          </Label>
                          <Badge variant="secondary">Not Validated</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {idea.problem_statement}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Generated on{" "}
                          {new Date(idea.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </RadioGroup>
            )}

            {generatedIdeas.filter((idea) => !idea.is_validated).length > 0 && (
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isPending || isValidationLimited || !selectedIdeaId}
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
                    {isValidationLimited
                      ? "Upgrade to Validate"
                      : "Validate Selected Idea"}
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Generated Ideas Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You need to generate startup ideas first before you can validate
              them.
            </p>
            <Button
              onClick={() => router.push("/dashboard/generate")}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Ideas First
            </Button>
          </div>
        )}

        {/* What's Included */}
        {generatedIdeas.length > 0 && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              What&apos;s included in validation:
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
        )}
      </CardContent>
    </Card>
  );
}
