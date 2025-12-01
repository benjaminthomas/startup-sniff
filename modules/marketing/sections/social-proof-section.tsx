"use client";

import { motion } from "framer-motion";
import { Star, Quote, TrendingUp, CheckCircle, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Solo Founder",
    company: "TaskFlow",
    avatar: "SC",
    rating: 5,
    quote: "StartupSniff helped me find a validated SaaS idea in 48 hours. I was able to launch my MVP 3 months faster than my previous startup. The Reddit insights are pure gold.",
    result: "Launched in 3 months, $15K MRR",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Marcus Rodriguez",
    role: "Technical Co-founder",
    company: "DevToolkit",
    avatar: "MR",
    rating: 5,
    quote: "I was skeptical at first, but the AI-powered validation saved me from building another product nobody wanted. Found a niche with real demand and paying customers on day one.",
    result: "50+ pre-sales before launch",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Emily Watson",
    role: "Product Manager",
    company: "CloudSync Pro",
    avatar: "EW",
    rating: 5,
    quote: "We use StartupSniff to validate feature ideas before adding them to our roadmap. It's like having a focus group of thousands, available 24/7. Completely changed how we prioritize.",
    result: "40% increase in feature adoption",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "David Kim",
    role: "Serial Entrepreneur",
    company: "3 Successful Exits",
    avatar: "DK",
    rating: 5,
    quote: "In my 15 years building startups, this is the first tool that actually delivers on the promise of 'validated ideas'. The market insights are actionable and the AI analysis is spot-on.",
    result: "Found next $10M opportunity",
    gradient: "from-orange-500 to-red-500",
  },
  {
    name: "Priya Sharma",
    role: "First-time Founder",
    company: "StudyBuddy AI",
    avatar: "PS",
    rating: 5,
    quote: "As someone new to entrepreneurship, StartupSniff gave me the confidence to start. I knew there was real demand before I wrote a single line of code. Best $29 I've ever spent.",
    result: "500+ waitlist signups in week 1",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    name: "James Anderson",
    role: "Developer → Founder",
    company: "CodeSnap",
    avatar: "JA",
    rating: 5,
    quote: "Finally, a tool that speaks my language. Clear data, actionable insights, no fluff. Helped me identify a gap in the developer tools market that I'm now building for.",
    result: "Secured $100K pre-seed",
    gradient: "from-teal-500 to-blue-500",
  },
];

const stats = [
  {
    value: "1,200+",
    label: "Active Founders",
    icon: TrendingUp,
  },
  {
    value: "2,500+",
    label: "Ideas Generated",
    icon: CheckCircle,
  },
  {
    value: "87%",
    label: "Success Rate",
    icon: Award,
  },
];

export function SocialProofSection() {
  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary mb-4">
            <Star className="h-4 w-4 fill-primary" />
            Loved by Founders
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
            Join Hundreds of Successful Founders
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            See how StartupSniff is helping entrepreneurs turn Reddit insights into thriving businesses
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

              {/* Card */}
              <div className="relative h-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 flex flex-col">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-primary/20 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-muted-foreground mb-6 leading-relaxed flex-grow">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Result Badge */}
                <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${testimonial.gradient} bg-opacity-10 px-3 py-1.5 text-xs font-semibold mb-4 w-fit`}>
                  <TrendingUp className="h-3 w-3" />
                  {testimonial.result}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <Avatar className={`w-12 h-12 bg-gradient-to-br ${testimonial.gradient}`}>
                    <AvatarFallback className="text-white font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {testimonial.role} @ {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <div className="text-sm font-semibold">4.9/5 Average Rating</div>
                <div className="text-xs text-muted-foreground">From 200+ reviews</div>
              </div>

              <div className="h-12 w-px bg-border hidden md:block mx-auto" />

              <div>
                <div className="text-2xl font-bold text-primary mb-1">87%</div>
                <div className="text-sm font-semibold">Validation Accuracy</div>
                <div className="text-xs text-muted-foreground">Ideas that go to market</div>
              </div>

              <div className="h-12 w-px bg-border hidden md:block mx-auto" />

              <div>
                <div className="text-2xl font-bold text-primary mb-1">3x</div>
                <div className="text-sm font-semibold">Faster Launch</div>
                <div className="text-xs text-muted-foreground">vs. traditional methods</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
