import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart3, Target, Users, DollarSign, CheckCircle } from "lucide-react";

export default function ValidationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Idea Validation"
        description="Validate your startup ideas with AI-powered market research and analysis"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ideas Validated</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4B</div>
            <p className="text-xs text-muted-foreground">Average TAM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150K</div>
            <p className="text-xs text-muted-foreground">Estimated reach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$50K</div>
            <p className="text-xs text-muted-foreground">Monthly estimate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Validate Your Idea</CardTitle>
          <CardDescription>
            Get comprehensive market analysis and validation insights for your startup idea
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idea-title">Idea Title</Label>
            <Input
              id="idea-title"
              placeholder="Enter your startup idea title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idea-description">Idea Description</Label>
            <Textarea
              id="idea-description"
              placeholder="Describe your startup idea in detail..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-market">Target Market</Label>
            <Input
              id="target-market"
              placeholder="Who is your target audience?"
            />
          </div>

          <Button className="w-full">
            <BarChart3 className="mr-2 h-4 w-4" />
            Validate Idea
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}