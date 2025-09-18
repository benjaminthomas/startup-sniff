import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  TrendingUp,
  Target,
  Shield,
  CheckCircle,
  AlertTriangle,
  Star,
  Users,
  DollarSign
} from 'lucide-react';

interface IdeaValidationSectionProps {
  idea: any;
  validationData: any;
}

export function IdeaValidationSection({ idea, validationData }: IdeaValidationSectionProps) {
  if (!validationData) return null;

  const {
    feasibilityScore = 0,
    marketPotential = 0,
    competitionLevel = 0,
    feedback = '',
    strengths = [],
    weaknesses = [],
    recommendations = []
  } = validationData;

  const overallScore = Math.round((feasibilityScore + marketPotential + (10 - competitionLevel)) / 3 * 10);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Card className="border-2 py-0">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/10 dark:to-green-950/10 py-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          AI Validation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-6">
          {/* Overall Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreColor(overallScore)}`}>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{overallScore}%</div>
              <div className="text-lg font-medium mb-3">
                {overallScore >= 80 ? 'Excellent Potential' :
                 overallScore >= 65 ? 'Good Opportunity' :
                 overallScore >= 50 ? 'Worth Exploring' : 'Needs Improvement'}
              </div>
              <Progress value={overallScore} className="h-3 mb-2" />
              <p className="text-sm opacity-80">Overall validation score based on AI analysis</p>
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800">
              <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{feasibilityScore}/10</div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Feasibility</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-800">
              <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{marketPotential}/10</div>
              <div className="text-sm text-green-800 dark:text-green-200">Market Potential</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800">
              <Shield className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{competitionLevel}/10</div>
              <div className="text-sm text-red-800 dark:text-red-200">Competition Level</div>
            </div>
          </div>

          {/* AI Feedback */}
          {feedback && (
            <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/10 dark:to-indigo-950/10 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                AI Analysis Summary
              </h4>
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{feedback}</p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strengths.length > 0 && (
              <div className="p-6 rounded-xl bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/10 dark:to-emerald-950/10 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Key Strengths
                </h4>
                <div className="space-y-3">
                  {strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div className="p-6 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Areas for Improvement
                </h4>
                <div className="space-y-3">
                  {weaknesses.map((weakness: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/10 dark:to-cyan-950/10 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                AI Recommendations
              </h4>
              <div className="space-y-3">
                {recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-black/20">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">{idx + 1}</span>
                    </div>
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}