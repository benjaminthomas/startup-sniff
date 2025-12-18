# StartupSniff

AI-powered startup idea discovery and validation platform built with Next.js 15, Supabase, and modern web technologies.

## 🎯 Product Overview

### Mission Statement
Empower entrepreneurs to discover trending startup opportunities through AI-powered idea generation, comprehensive market validation, and Reddit trend analysis.

### Core Value Propositions
- **Reddit-Powered Idea Generation**: Transform real Reddit pain points into validated startup opportunities
- **Comprehensive Idea Detail Pages**: Rich, interactive pages with market analysis and validation results
- **AI Market Validation Engine**: Research and validate ideas with GPT-4 powered analysis
- **Real-time Pain Point Detection**: Monitor 20+ subreddits for emerging market needs
- **Interactive Dashboard**: Beautiful, engaging interface with sticky headers and seamless navigation

## 🚀 Features

### 🧠 **Enhanced Idea Generation**
- **Reddit-Powered Intelligence**: Generate ideas from real user pain points expressed on Reddit
- **Advanced Pain Point Detection**: Sophisticated regex patterns identify genuine market needs
- **Smart Parameter Mapping**: User preferences automatically mapped to Reddit data filtering
- **Fallback System**: OpenAI GPT-4 backup when Reddit data is unavailable

### 📊 **Rich Idea Detail Pages**
- **Comprehensive Layout**: Three-column responsive design with sticky headers
- **Interactive Validation**: Engaging AI-powered market analysis with detailed scoring
- **Visual Progress Indicators**: Beautiful progress bars and confidence scoring
- **Reddit Sources Display**: Show actual community discussions that inspired ideas
- **Action-Oriented Design**: Clear CTAs for validation, favorites, and exports

### 🎯 **Advanced Validation System**
- **Multi-Factor Analysis**: Feasibility, market potential, and competition scoring
- **AI-Powered Insights**: GPT-4 generates detailed feedback and recommendations
- **Visual Validation Results**: Color-coded scoring with detailed breakdowns
- **Strengths & Weaknesses**: Actionable insights for idea improvement
- **Implementation Roadmaps**: Detailed cost estimates and timeline planning

### 💫 **Modern User Experience**
- **Sticky Navigation**: Non-scrollable headers for better navigation
- **Animated Interactions**: Smooth transitions and engaging micro-interactions
- **Loading States**: Detailed progress indicators during AI processing
- **Responsive Design**: Beautiful interface across all device sizes
- **Dark Mode Support**: Consistent theming with automatic detection

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2 with App Router and Turbopack
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Icons**: Lucide React icon system (replacing SVG icons)
- **Authentication**: Supabase Auth with secure server-side session management
- **AI Integration**: OpenAI GPT-4 and Claude for content generation
- **Payments**: Razorpay with webhook integration
- **Forms**: React Hook Form + Zod validation
- **TypeScript**: Strict mode with generated Supabase types
- **Testing**: Playwright for E2E testing with MCP integration

### Security-First Design
- **HttpOnly Cookies**: All auth tokens stored securely, never exposed to client-side JS
- **CSRF Protection**: Double-submit cookie pattern on all forms
- **Token-Based Password Reset**: Eliminates session persistence issues
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Zod schemas validate all user inputs
- **Security Logging**: Comprehensive audit trail (with PII redaction)

## 🔄 **Complete Application Workflow**

### **1. Reddit-Powered Idea Generation**
```
User Input → Parameter Mapping → Reddit Pain Point Selection → AI Analysis → Comprehensive Idea
```

**The Process:**
1. **User Preferences**: Industry, budget, timeframe, target audience
2. **Smart Mapping**: Convert user inputs to Reddit data filtering criteria
3. **Pain Point Extraction**: AI identifies genuine market needs from Reddit discussions
4. **Idea Synthesis**: GPT-4 transforms pain points into detailed business ideas
5. **Market Integration**: Add implementation details, costs, and success metrics

### **2. Enhanced Idea Detail Pages**
```
Idea Selection → Rich Detail View → Interactive Validation → Action Center
```

**Key Features:**
- **Comprehensive Layout**: Three-column responsive design with sticky headers
- **Visual Confidence Scoring**: Color-coded AI confidence ratings with progress indicators
- **Reddit Sources**: Display actual community discussions that inspired the idea
- **Validation Center**: Interactive AI-powered market analysis with detailed insights
- **Action Hub**: Favorites, export, validation, and sharing capabilities

### **3. AI Validation System**
```
Validation Request → Multi-Factor Analysis → Detailed Report → Actionable Insights
```

**Analysis Components:**
- **Feasibility Score (1-10)**: Technical and operational viability assessment
- **Market Potential (1-10)**: Market size, growth opportunity, and demand analysis
- **Competition Level (1-10)**: Market saturation and competitive landscape
- **Comprehensive Report**: Strengths, weaknesses, and strategic recommendations

## 🔐 Authentication System

### Features
- **Secure Sign-In/Sign-Up**: Email/password with proper validation
- **Password Reset**: Token-based flow with 10-minute expiration
- **Session Management**: HttpOnly cookies with automatic refresh
- **OAuth Support**: Ready for Google, GitHub, and other providers
- **CSRF Protection**: Built-in protection against cross-site request forgery

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Form   │───▶│  Server Action   │───▶│  Supabase Auth  │
│  (CSRF Token)   │    │  (Validation)    │    │   (Secure DB)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Toast/Error   │    │  Security Log    │    │  HttpOnly       │
│   Feedback      │    │  (PII Redacted)  │    │  Cookies        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Password Reset Flow
1. User requests password reset → Email sent with secure callback URL
2. Callback route validates code → Generates time-limited recovery token
3. Reset page accepts token → Validates expiration and authenticity  
4. Form submission → Admin client updates password (no session required)
5. Success redirect → User signs in with new password

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase project (local or hosted)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startup-sniff
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # App Configuration  
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Security Keys (generate secure random strings)
   CSRF_SECRET=your_csrf_secret_key
   ```

4. **Set up Supabase database**
   ```bash
   # If using local Supabase
   npx supabase start
   
   # Apply migrations
   npx supabase db reset
   
   # Generate TypeScript types
   npx supabase gen types --local > types/supabase.ts
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
startup-sniff/
├── app/                           # Next.js 15.5.2 App Router
│   ├── (dashboard)/               # Protected dashboard routes  
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Main dashboard overview
│   │   │   ├── generate/          # AI idea generation
│   │   │   ├── ideas/             # Saved ideas management
│   │   │   ├── validation/        # Market validation tools
│   │   │   ├── trends/            # Reddit trend analysis
│   │   │   ├── content/           # Content generation
│   │   │   └── billing/           # Subscription management
│   │   └── layout.tsx             # Dashboard shell with sidebar
│   ├── auth/                      # Authentication flows
│   │   ├── signin/                # Sign in page
│   │   ├── signup/                # Sign up page  
│   │   ├── forgot-password/       # Password reset request
│   │   ├── reset-password/        # Password reset form
│   │   └── callback/              # OAuth/email confirmation
│   ├── api/                       # API routes
│   │   └── webhooks/razorpay/     # Razorpay webhook handler
│   ├── icon.tsx                   # Dynamic favicon generation
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Tailwind v4 + CSS variables
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── auth/                      # Authentication components
│   ├── features/                  # Feature-specific components
│   │   ├── dashboard/             # Dashboard-related UI
│   │   └── billing/               # Subscription/billing UI
│   └── examples/                  # Component examples
├── lib/
│   ├── auth/                      # Authentication utilities
│   ├── supabase/                  # Database clients (server/client)
│   ├── ai/                        # OpenAI integration
│   ├── icons.ts                   # Lucide React icon mappings
│   └── utils.ts                   # Common utilities
├── server/                        # Server-only code
│   └── actions/                   # Server actions (ideas, billing)
├── constants/                     # Application constants
├── types/
│   ├── supabase.ts                # Generated Supabase types
│   └── global.ts                  # Application types
├── styles/                        # Design system
│   └── design-tokens.json         # Design tokens
├── database-setup.sql             # Complete database schema
├── supabase/                      # Supabase configuration
│   ├── migrations/                # Database migrations
│   └── config.toml                # Local development config
├── hooks/                         # Custom React hooks
├── scripts/                       # Build and utility scripts
└── middleware.ts                  # Next.js auth middleware
```

## 🔧 Development

### Database Migrations
Always use migrations for schema changes:

```bash
# Create new migration
npx supabase migration new add_new_feature

# Apply migrations locally
npx supabase db reset

# Generate updated types
npx supabase gen types --local > types/supabase.ts
```

### Type Safety
- All database operations use generated TypeScript types
- Strict TypeScript configuration enforces type safety
- Zod schemas validate runtime data

### Security Best Practices
- Never log sensitive data (passwords, emails) - use `[REDACTED]`
- Always validate inputs with Zod schemas
- Use CSRF tokens on all forms
- Implement proper rate limiting
- Follow principle of least privilege

## 📊 Database Schema

### Pricing & Plan Structure

| Plan | Price | Ideas/Month | Validations/Month | Key Features |
|------|-------|-------------|-------------------|---------------|
| **Explorer** | Free | 3 | 1 | Basic Reddit analysis, Standard content |
| **Founder** | $19 | 25 | 10 | Advanced analysis, PDF export, Priority support |
| **Growth** | $49 | Unlimited | Unlimited | Multi-platform trends, API access, Consultation |

### Core Database Schema

```sql
-- Main Entity Relationships
users (id, email, plan_type, razorpay_customer_id)
├── subscriptions (razorpay data, billing cycles)
├── usage_limits (plan quotas, monthly resets)
├── startup_ideas (AI-generated concepts with validation)
└── generated_content (marketing materials, blog posts)

-- Key JSONB Data Structures
startup_ideas.target_market = {
  "demographic": "string",
  "size": "number", 
  "pain_level": "high|medium|low"
}

startup_ideas.solution = {
  "value_proposition": "string",
  "features": ["string"],
  "business_model": "string"
}
```

### Core Tables
- `users` - User profiles and metadata with plan information
- `startup_ideas` - AI-generated startup ideas with market analysis
- `generated_content` - AI-generated marketing content (blog posts, tweets, emails)
- `usage_limits` - User plan limits and monthly usage tracking
- `subscriptions` - Razorpay billing and subscription data
- `market_validations` - Market research and validation results

### Security Tables
- `security_events` - Audit log for security events and rate limiting
- `rate_limits` - API rate limiting by user and plan type

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
# Core Application
NEXT_PUBLIC_APP_URL=https://startupsniff.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiJ9...

# Server-Side Keys (Never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiJ9...
CSRF_SECRET=your-production-csrf-secret

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Razorpay Payment Integration
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...

# Reddit API (for trend analysis)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
```

## 🎨 Design System & UI Components

### shadcn/ui Integration
- **Component Architecture**: All UI built with shadcn/ui components for consistency
- **Design Tokens**: Custom CSS variables for StartupSniff branding
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Accessibility**: WCAG compliant components with proper ARIA labels
- **Icon System**: Lucide React icons with semantic naming conventions

### Key Features
- **Dynamic Favicon**: Next.js 15+ dynamic icon generation with branded design
- **Responsive Sidebar**: Collapsible sidebar with proper state management
- **Profile Dropdown**: Fixed hover states and proper contrast ratios
- **Plan Badges**: Visual subscription plan indicators in header
- **Breadcrumbs**: Dynamic route-based navigation breadcrumbs

### Component Standards
- ✅ **shadcn/ui components only** - No custom styled divs
- ✅ **Lucide React icons exclusively** - No SVG files
- ✅ **Proper hover states** - Tested with Playwright
- ✅ **Accessibility first** - Screen reader compatible
- ✅ **TypeScript strict** - Fully typed components

## 🧪 Testing

### Playwright end-to-end coverage

Following the [official Next.js Playwright guide](https://nextjs.org/docs/app/building-your-application/testing/playwright), the project standardizes on Playwright for automated testing:

- `npm test` / `npm run test:e2e` – execute the Chromium project.
- `npm run test:e2e:install` – download browser binaries (once per machine/CI).
- `npm run test:e2e -- --list` – enumerate specs without binding a server (useful inside Codex).
- `npm run test:e2e:ui` – launch the Playwright UI runner for focused debugging.
- `npm run test:e2e:report` – open the latest HTML report (if generated with `--reporter=html`).

Current coverage spans:

- Marketing landing + legal pages (`marketing-home`, `marketing-legal`).
- Contact module UI + `/api/contact` validation (`contact-form`, `api-contact`).
- Auth entry/recovery guardrails (`auth-pages`).
- Dashboard, billing, and analytics route protection (`dashboard-access`).

Playwright defaults to launching `npm run dev -- --hostname 127.0.0.1 --port 4123`.  
Override these defaults with the following environment variables when needed:

| Variable | Purpose |
| --- | --- |
| `E2E_PORT` / `PLAYWRIGHT_PORT` | Custom port for the Next.js server |
| `E2E_HOST` | Hostname to bind during the test run |
| `E2E_BASE_URL` | Explicit base URL (skip auto-building from host/port) |
| `E2E_WEB_COMMAND` | Custom command (e.g. `npm run start -- --port 4123`) |

> **Note:** Sandboxed environments (including the Codex CLI) block listening sockets, so full Playwright runs may fail with `listen EPERM`. Use `--list` locally inside the CLI to confirm discovery, then execute `npm run build && PLAYWRIGHT_WEB_COMMAND="npm run start -- --port 4123" npm run test:e2e` on a host that allows binding to the chosen port.

### MCP Testing Integration
- **Playwright MCP**: Automated UI coverage with mock-friendly helpers
- **Supabase MCP**: Database schema validation and SQL generation  
- **Context7 MCP**: Documentation sync against the latest Next.js testing guides
- **Shadcn MCP**: Component conformance checks and registry lookups

## 📝 Contributing

1. Follow the authentication patterns established in the codebase
2. Always use TypeScript with strict typing
3. Implement proper error handling and validation
4. Add tests for new features
5. Follow security best practices (no logging of sensitive data)
6. Use conventional commit messages

### Commit Message Format
```
feat: add new authentication feature
fix: resolve password reset issue
docs: update API documentation
refactor: improve error handling
test: add integration tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

### Reporting Security Issues
Please report security vulnerabilities to [security@yourdomain.com](mailto:security@yourdomain.com).

### Security Features
- **No Credential Logging**: All sensitive data is redacted in logs
- **Token-Based Password Reset**: Eliminates session persistence vulnerabilities
- **CSRF Protection**: Double-submit cookie pattern
- **Rate Limiting**: Protection against brute force attacks
- **Secure Headers**: HttpOnly, Secure, SameSite cookie attributes
- **Input Validation**: Server-side validation of all inputs
- **Session Security**: Automatic token refresh and secure session management

## 🆘 Support

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Open a GitHub issue for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and community support

## 🔄 Recent Updates

### v1.0 (Latest)
- ✅ **UI/UX Overhaul**: Complete migration to shadcn/ui components
- ✅ **Icon System**: Replaced SVGs with Lucide React icon system
- ✅ **Responsive Dashboard**: Mobile-first sidebar with collapse functionality
- ✅ **Container Width Fix**: Consistent max-width (1280px) across all dashboard pages
- ✅ **Navigation Cleanup**: Removed deprecated validation dashboard links from sidebar
- ✅ **UI Audit Report**: Comprehensive testing with Playwright MCP for design consistency
- ✅ **Profile Dropdown**: Fixed hover states and visibility issues
- ✅ **Dynamic Favicon**: Next.js 15+ branded favicon generation
- ✅ **Plan Badges**: Visual subscription indicators in header
- ✅ **MCP Integration**: Automated testing and development workflows
- ✅ **CSRF Security Fix**: Resolved cookie context issues between middleware and Server Actions
- ✅ **Authentication Testing**: Comprehensive security test suite with 10 security validations

### Development Status
- 🚧 **AI Integration**: OpenAI and Claude API implementation in progress
- 🚧 **Reddit Analysis**: Trend mining and sentiment analysis features
- 🚧 **Stripe Billing**: Subscription management and webhooks
- 📋 **Content Generation**: Marketing copy and blog post creation
- 📋 **Market Validation**: Comprehensive idea validation engine

---

**StartupSniff** - AI-powered startup idea discovery platform  
Built with Next.js 15, Supabase, shadcn/ui, and modern web technologies.

*Ready to validate your next big idea?* 🚀
