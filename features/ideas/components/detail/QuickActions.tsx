/**
 * QuickActions Component
 *
 * Displays quick action buttons in the sidebar for:
 * - Generate Content
 * - Analyze Trends
 * - Similar Ideas
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Target, ArrowRight } from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start">
          <FileText className="h-4 w-4 mr-2" />
          Generate Content
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <TrendingUp className="h-4 w-4 mr-2" />
          Analyze Trends
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <Target className="h-4 w-4 mr-2" />
          Similar Ideas
          <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
