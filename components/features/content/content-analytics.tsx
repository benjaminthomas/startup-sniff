'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Users,
  Activity,
  Zap,
  TrendingUp,
  Target,
  Clock
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, PieChart as RechartsPieChart, Cell, Pie } from "recharts";

interface GeneratedContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  brand_voice?: string | null;
  seo_keywords?: string[] | null;
  created_at: string;
  startup_idea_id?: string | null;
  updated_at?: string;
  user_id?: string;
}

interface ContentAnalyticsProps {
  content: GeneratedContent[];
}

export function ContentAnalytics({ content }: ContentAnalyticsProps) {
  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'blog_post': return 'Blog Post';
      case 'tweet': return 'Twitter Thread';
      case 'email': return 'Email Campaign';
      case 'landing_page': return 'Landing Page';
      default: return 'Content';
    }
  };

  const contentByType = content.reduce((acc, item) => {
    if (!acc[item.content_type]) {
      acc[item.content_type] = [];
    }
    acc[item.content_type].push(item);
    return acc;
  }, {} as Record<string, GeneratedContent[]>);

  if (content.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create your first piece of content to see detailed performance analytics, charts, and insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Distribution Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Content Distribution</h3>
          </div>
          {Object.entries(contentByType).length === 1 ? (
            // Show a progress-style visual for single content type
            <div className="h-[200px] flex items-center justify-center">
              {Object.entries(contentByType).map(([type, items]) => (
                <div key={type} className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                      <div className="text-white text-center">
                        <div className="text-sm font-medium">{getContentTypeLabel(type)}</div>
                        <div className="text-2xl font-bold">{items.length}</div>
                        <div className="text-xs opacity-90">{items.length === 1 ? 'piece' : 'pieces'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">100% of your content</div>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium">{getContentTypeLabel(type)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show pie chart for multiple content types
            <ChartContainer
              config={{
                blog_post: {
                  label: "Blog Posts",
                  color: "hsl(var(--primary))",
                },
                tweet: {
                  label: "Twitter Threads",
                  color: "hsl(210, 100%, 60%)",
                },
                email: {
                  label: "Email Campaigns",
                  color: "hsl(142, 76%, 36%)",
                },
                landing_page: {
                  label: "Landing Pages",
                  color: "hsl(280, 100%, 70%)",
                },
              }}
              className="h-[200px]"
            >
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={Object.entries(contentByType).map(([type, items]) => ({
                    name: getContentTypeLabel(type),
                    value: items.length,
                    fill: {
                      blog_post: "hsl(var(--primary))",
                      tweet: "hsl(210, 100%, 60%)",
                      email: "hsl(142, 76%, 36%)",
                      landing_page: "hsl(280, 100%, 70%)",
                    }[type] || "hsl(var(--muted))"
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {Object.entries(contentByType).map(([type], index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={{
                        blog_post: "hsl(var(--primary))",
                        tweet: "hsl(210, 100%, 60%)",
                        email: "hsl(142, 76%, 36%)",
                        landing_page: "hsl(280, 100%, 70%)",
                      }[type] || "hsl(var(--muted))"}
                    />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ChartContainer>
          )}
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Performance Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Avg. Word Count</span>
              </div>
              <span className="font-semibold">
                {Math.round(content.reduce((acc, item) => acc + (item.content?.length || 0), 0) / 5 / content.length) || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm">Total Keywords</span>
              </div>
              <span className="font-semibold">
                {content.reduce((acc, item) => acc + (item.seo_keywords?.length || 0), 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Avg. Read Time</span>
              </div>
              <span className="font-semibold">
                {Math.round(content.reduce((acc, item) => acc + Math.ceil((item.content?.length || 0) / 1000), 0) / content.length)} min
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Content Pieces</span>
              </div>
              <span className="font-semibold">{content.length}</span>
            </div>
          </div>
        </Card>

        {/* Content Creation Trends */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Content Volume by Type</h3>
          </div>
          {Object.entries(contentByType).length === 1 ? (
            // Show a simple visual for single content type
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                {Object.entries(contentByType).map(([type, items]) => (
                  <div key={type} className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-primary-foreground">{items.length}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-primary mb-2">{getContentTypeLabel(type)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {items.length === 1 ? 'piece' : 'pieces'} of content created
                    </p>
                    <div className="mt-3 text-xs text-muted-foreground">
                      Avg. {Math.round(items.reduce((acc, item) => acc + (item.content?.length || 0), 0) / 5 / items.length) || 0} words
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Show bar chart for multiple content types
            <ChartContainer
              config={{
                count: {
                  label: "Content Count",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px]"
            >
              <BarChart
                data={Object.entries(contentByType).map(([type, items]) => ({
                  type: getContentTypeLabel(type),
                  count: items.length,
                  avgWords: Math.round(items.reduce((acc, item) => acc + (item.content?.length || 0), 0) / 5 / items.length) || 0
                }))}
              >
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </Card>
      </div>
    </div>
  );
}