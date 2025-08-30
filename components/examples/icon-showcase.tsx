// components/examples/icon-showcase.tsx
// Example component demonstrating StartupSniff Icon System usage

import { FeatureIcons, IconSizes } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function IconShowcase() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FeatureIcons.Settings className={IconSizes.lg} />
            <span className="ml-2">StartupSniff Icon System</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Feature Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Core Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start">
                <FeatureIcons.IdeaGeneration className={IconSizes.sm} />
                <span className="ml-2">Generate Ideas</span>
              </Button>
              <Button variant="outline" className="justify-start">
                <FeatureIcons.MarketResearch className={IconSizes.sm} />
                <span className="ml-2">Validate Market</span>
              </Button>
              <Button variant="outline" className="justify-start">
                <FeatureIcons.BlogPost className={IconSizes.sm} />
                <span className="ml-2">Create Content</span>
              </Button>
              <Button variant="outline" className="justify-start">
                <FeatureIcons.RedditTrends className={IconSizes.sm} />
                <span className="ml-2">Analyze Trends</span>
              </Button>
            </div>
          </div>

          {/* Icon Sizes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Icon Sizes</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FeatureIcons.Lightbulb className={IconSizes.xs} />
                <span className="text-sm">XS (12px)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FeatureIcons.Lightbulb className={IconSizes.sm} />
                <span className="text-sm">SM (16px)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FeatureIcons.Lightbulb className={IconSizes.md} />
                <span className="text-sm">MD (20px)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FeatureIcons.Lightbulb className={IconSizes.lg} />
                <span className="text-sm">LG (24px)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FeatureIcons.Lightbulb className={IconSizes.xl} />
                <span className="text-sm">XL (32px)</span>
              </div>
            </div>
          </div>

          {/* States */}
          <div>
            <h3 className="text-lg font-semibold mb-4">State Icons</h3>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-green-600">
                <FeatureIcons.Success className={IconSizes.md} />
                <span>Success</span>
              </div>
              <div className="flex items-center space-x-2 text-yellow-600">
                <FeatureIcons.Warning className={IconSizes.md} />
                <span>Warning</span>
              </div>
              <div className="flex items-center space-x-2 text-red-600">
                <FeatureIcons.Error className={IconSizes.md} />
                <span>Error</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-600">
                <FeatureIcons.Loading className={`${IconSizes.md} animate-spin`} />
                <span>Loading</span>
              </div>
            </div>
          </div>

          {/* Navigation Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost">
                <FeatureIcons.Back className={IconSizes.sm} />
              </Button>
              <Button size="sm" variant="ghost">
                <FeatureIcons.Forward className={IconSizes.sm} />
              </Button>
              <Button size="sm" variant="ghost">
                <FeatureIcons.Up className={IconSizes.sm} />
              </Button>
              <Button size="sm" variant="ghost">
                <FeatureIcons.Down className={IconSizes.sm} />
              </Button>
              <Button size="sm" variant="ghost">
                <FeatureIcons.External className={IconSizes.sm} />
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

// Usage in pages:
// import { IconShowcase } from '@/components/examples/icon-showcase'
// <IconShowcase />