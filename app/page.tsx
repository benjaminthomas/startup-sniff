'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Globe,
  Star,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { HeroHighlight, Highlight } from '@/components/ui/aceternity/hero-highlight';
import { TextGenerateEffect } from '@/components/ui/aceternity/text-generate-effect';
import { AnimatedCounter } from '@/components/ui/aceternity/animated-counter';
import { CardContainer, CardBody, CardItem } from '@/components/ui/aceternity/3d-card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-purple">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-xl text-gradient">StartupSniff</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center space-x-6"
            >
              <div className="hidden md:flex items-center space-x-6">
                <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </div>
              <Button variant="ghost" asChild className="text-sm">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild className="gradient-primary glow-purple text-sm">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      {/* Hero Section */}
      <HeroHighlight>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Badge variant="outline" className="mb-8 bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-500/20 dark:border-purple-400/30 dark:text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                AI-Powered Startup Discovery
              </Badge>
            </motion.div>

            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <TextGenerateEffect
                  words="Discover Your Next Million-Dollar Startup Idea"
                  className="text-5xl md:text-7xl font-bold text-foreground dark:text-white"
                />
              </h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="text-xl md:text-2xl text-muted-foreground dark:text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Use AI to <Highlight className="text-foreground dark:text-white bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-600/80 dark:to-blue-600/80">analyze Reddit trends</Highlight>, validate market opportunities, and generate startup ideas that actually solve real problems.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button size="lg" asChild className="text-lg px-8 py-4 gradient-primary glow-purple">
                <Link href="/auth/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 border-primary/30 hover:bg-primary/10">
                <Link href="#demo">
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            >
              <div className="space-y-2">
                <AnimatedCounter value={10000} suffix="+" className="text-4xl md:text-5xl font-bold text-foreground dark:text-white" />
                <div className="text-muted-foreground dark:text-white/80 text-lg">Reddit Posts Analyzed</div>
              </div>
              <div className="space-y-2">
                <AnimatedCounter value={2500} suffix="+" className="text-4xl md:text-5xl font-bold text-foreground dark:text-white" />
                <div className="text-muted-foreground dark:text-white/80 text-lg">Ideas Generated</div>
              </div>
              <div className="space-y-2">
                <AnimatedCounter value={87} suffix="%" className="text-4xl md:text-5xl font-bold text-foreground dark:text-white" />
                <div className="text-muted-foreground dark:text-white/80 text-lg">Validation Accuracy</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </HeroHighlight>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
              Everything You Need to Launch Smart
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From Reddit trend analysis to market validation, we&apos;ve got your startup journey covered
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Lightbulb,
                title: "AI Idea Generation",
                description: "Generate unique startup ideas based on real market problems and trending discussions from Reddit communities.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: TrendingUp,
                title: "Reddit Trend Analysis",
                description: "Analyze millions of Reddit posts to identify emerging problems and untapped market opportunities.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: BarChart3,
                title: "Market Validation",
                description: "Validate your ideas with AI-powered market research, competitive analysis, and opportunity scoring.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Target,
                title: "Content Generation",
                description: "Generate blog posts, social media content, and marketing materials tailored to your startup idea.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: Users,
                title: "ICP Analysis",
                description: "Identify your ideal customer profile with detailed demographics, pain points, and market size estimates.",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: Globe,
                title: "Export & Share",
                description: "Export your research to PDF, Notion, or share directly with your team and potential investors.",
                gradient: "from-teal-500 to-blue-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <CardContainer className="inter-var">
                  <CardBody className="bg-card relative group/card dark:hover:shadow-2xl dark:hover:shadow-primary/[0.1] border-border w-auto sm:w-[25rem] h-auto rounded-xl p-6 border">
                    <CardItem
                      translateZ="50"
                      className="text-xl font-bold text-foreground mb-2"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center mb-4 glow-purple`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      {feature.title}
                    </CardItem>
                    <CardItem
                      as="p"
                      translateZ="60"
                      className="text-muted-foreground text-sm max-w-sm mt-2 leading-relaxed"
                    >
                      {feature.description}
                    </CardItem>
                    <CardItem
                      translateZ="100"
                      className="w-full mt-4"
                    >
                      <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-4 text-xs">
                        {feature.title === "AI Idea Generation" && (
                          <div className="space-y-2">
                            <div className="bg-white/10 rounded p-2">
                              <div className="font-semibold">💡 SaaS for Pet Owners</div>
                              <div className="text-muted-foreground">Reddit r/dogs • 89% match</div>
                            </div>
                            <div className="bg-white/10 rounded p-2">
                              <div className="font-semibold">🏠 Remote Work Tools</div>
                              <div className="text-muted-foreground">Reddit r/remotework • 76% match</div>
                            </div>
                          </div>
                        )}
                        {feature.title === "Reddit Trend Analysis" && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>r/entrepreneur</span>
                              <span className="text-green-400">↗ +23%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>r/startups</span>
                              <span className="text-green-400">↗ +15%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>r/SaaS</span>
                              <span className="text-red-400">↘ -8%</span>
                            </div>
                          </div>
                        )}
                        {feature.title === "Market Validation" && (
                          <div className="space-y-2">
                            <div className="bg-green-500/20 rounded p-2">
                              <div className="font-semibold">Market Score: 87/100</div>
                              <div className="text-green-400">✓ High demand detected</div>
                            </div>
                            <div className="text-xs">Competition: Medium • TAM: $2.3B</div>
                          </div>
                        )}
                        {feature.title === "Content Generation" && (
                          <div className="space-y-1">
                            <div className="font-semibold">📝 Blog Post: &ldquo;5 Pain Points...&rdquo;</div>
                            <div className="font-semibold">🐦 Tweet: &ldquo;Just discovered...&rdquo;</div>
                            <div className="font-semibold">📊 Landing Page: Hero section</div>
                          </div>
                        )}
                        {feature.title === "ICP Analysis" && (
                          <div className="space-y-1">
                            <div className="font-semibold">👤 Primary: Tech professionals</div>
                            <div>Age: 25-40 • Income: $75k+</div>
                            <div>Pain: Remote collaboration tools</div>
                          </div>
                        )}
                        {feature.title === "Export & Share" && (
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>📄 PDF Report</span>
                              <span className="text-primary">Ready</span>
                            </div>
                            <div className="flex justify-between">
                              <span>📝 Notion Export</span>
                              <span className="text-primary">Ready</span>
                            </div>
                            <div className="flex justify-between">
                              <span>🔗 Share Link</span>
                              <span className="text-primary">Generated</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardItem>
                  </CardBody>
                </CardContainer>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
              Choose Your Startup Discovery Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get unlimited access to AI-powered startup idea generation and market validation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Explorer",
                price: 0,
                period: "month",
                description: "Perfect for individual entrepreneurs just starting their startup journey",
                features: [
                  "3 AI-generated ideas per month",
                  "1 market validation per month",
                  "5 content pieces per month",
                  "Basic AI generation",
                  "Community access"
                ],
                popular: false
              },
              {
                name: "Founder",
                price: 29,
                period: "month",
                description: "Advanced features for serious entrepreneurs ready to scale their startup discovery",
                features: [
                  "25 AI-generated ideas per month",
                  "10 market validations per month",
                  "50 content pieces per month",
                  "Advanced AI generation",
                  "Premium templates",
                  "Market analysis",
                  "PDF export"
                ],
                popular: true
              },
              {
                name: "Growth",
                price: 99,
                period: "month",
                description: "Unlimited access for teams and accelerators with comprehensive business analysis needs",
                features: [
                  "Unlimited AI-generated ideas",
                  "Unlimited market validations",
                  "Unlimited content generation",
                  "Advanced market analysis",
                  "API access",
                  "Priority support",
                  "Team collaboration"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`relative h-full ${plan.popular ? 'border-primary glow-purple' : 'border-border'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="gradient-primary text-white px-3 py-1">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gradient">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <CardDescription className="mt-4 text-base">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardHeader className="pt-0">
                    <Button
                      size="lg"
                      className={`w-full ${plan.popular ? 'gradient-primary glow-purple' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Get Started
                    </Button>
                    <div className="mt-8 space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground dark:text-white">
              Ready to Find Your Next Big Idea?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of entrepreneurs using AI to discover and validate startup opportunities from Reddit trends
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 py-4 gradient-primary glow-purple">
                <Link href="/auth/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-4 border-primary/30 hover:bg-primary/10">
                <Link href="#demo">
                  Schedule Demo
                </Link>
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-6">
              No credit card required • 3 free ideas • Start in 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-purple">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-bold text-xl text-gradient">StartupSniff</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Empowering entrepreneurs with AI-driven insights to discover and validate the next generation of business opportunities.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#integrations" className="text-muted-foreground hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#careers" className="text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#press" className="text-muted-foreground hover:text-foreground transition-colors">Press</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#help" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#community" className="text-muted-foreground hover:text-foreground transition-colors">Community</Link></li>
                <li><Link href="#status" className="text-muted-foreground hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-muted-foreground">
                © 2024 StartupSniff. All rights reserved.
              </div>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link href="#cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
