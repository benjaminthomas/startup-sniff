# StartupSniff

A modern, secure startup idea generation and validation platform built with Next.js 15 and Supabase.

## 🚀 Features

- **AI-Powered Idea Generation**: Generate startup ideas based on market trends and user input
- **Market Validation**: Research and validate ideas with comprehensive market analysis
- **Secure Authentication**: Token-based password reset, CSRF protection, and session management
- **User Dashboard**: Track ideas, validation progress, and usage analytics
- **Content Generation**: Create marketing content, blog posts, and promotional materials

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2 with App Router and Turbopack
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Authentication**: Supabase Auth with secure server-side session management
- **Forms**: React Hook Form + Zod validation
- **TypeScript**: Strict mode for type safety

### Security-First Design
- **HttpOnly Cookies**: All auth tokens stored securely, never exposed to client-side JS
- **CSRF Protection**: Double-submit cookie pattern on all forms
- **Token-Based Password Reset**: Eliminates session persistence issues
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Zod schemas validate all user inputs
- **Security Logging**: Comprehensive audit trail (with PII redaction)

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
├── app/                      # Next.js App Router
│   ├── auth/                # Authentication pages
│   │   ├── signin/          # Sign in page
│   │   ├── signup/          # Sign up page
│   │   ├── forgot-password/ # Password reset request
│   │   ├── reset-password/  # Password reset form
│   │   └── callback/        # OAuth callback handler
│   ├── dashboard/           # Protected dashboard pages
│   └── layout.tsx           # Root layout
├── components/
│   ├── auth/               # Authentication form components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth/               # Authentication utilities
│   │   ├── actions.ts      # Server actions for auth
│   │   ├── supabase-server.ts # Server-side Supabase client
│   │   ├── supabase-client.ts # Browser-side Supabase client
│   │   ├── csrf.ts         # CSRF token management
│   │   └── security-logger.ts # Security event logging
│   └── utils.ts            # General utilities
├── types/
│   ├── supabase.ts         # Generated Supabase types
│   └── global.ts           # Global type definitions
├── middleware.ts           # Next.js middleware for auth
└── supabase/
    ├── migrations/         # Database migrations
    └── config.toml         # Supabase configuration
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

### Core Tables
- `users` - User profiles and metadata
- `startup_ideas` - Generated startup ideas
- `generated_content` - AI-generated marketing content
- `usage_limits` - User plan limits and tracking
- `subscriptions` - Billing and subscription data

### Security Tables
- `security_events` - Audit log for security events (optional)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security (Generate new secure keys)
CSRF_SECRET=your_production_csrf_secret
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

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

---

Built with ❤️ by the StartupSniff team using Next.js 15, Supabase, and modern web technologies.
