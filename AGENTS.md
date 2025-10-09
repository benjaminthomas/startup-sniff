# Monolithic to Modular Refactoring Agent Guidelines

## Agent Mission
Refactor existing Next.js monolithic application into modular, scalable architecture while preserving all functionality. Analyze current codebase, identify module boundaries, extract features into self-contained modules with zero cross-dependencies.

## Critical Constraints

### Existing Project Rules
- **DO NOT rebuild from scratch** - Refactor incrementally while maintaining functionality
- **Preserve existing features** - All current functionality must continue working
- **Custom JWT Auth** - Keep existing JWT authentication implementation, optimize if possible but DO NOT replace with Supabase Auth
- **Gradual Migration** - Migrate one module at a time, validate before proceeding
- **Backwards Compatibility** - Old and new code must coexist during transition

### Supabase MCP Limitations
- **Read-Only Access** - Cannot execute migrations directly
- **Generate Scripts** - Provide SQL migration scripts that user will run manually in Supabase dashboard
- **Schema Analysis** - Use Supabase MCP to read existing schema and generate insights
- **Policy Review** - Analyze existing RLS policies and suggest improvements
- **Script Output** - Output all migration scripts in code blocks for manual execution

---

## Project Structure & Module Organization

### Current Monolithic Structure Analysis
**Step 1: Scan Existing Structure**
- Analyze current directory structure in `app/`, `components/`, `lib/`, `pages/` (if applicable)
- Identify all existing routes, API endpoints, components, utilities
- Map current component dependencies and import patterns
- Document existing state management (Context, Redux, Zustand, etc.)
- List all database interactions and data fetching patterns

**Step 2: Identify Module Boundaries**
Based on existing codebase, group related functionality:
- Authentication & authorization features
- User management features
- Product/catalog features
- Order/transaction features
- Dashboard/analytics features
- Settings/configuration features

### Target Modular Structure
```
project-root/
├── app/                           # Existing Next.js App Router (preserve routes)
│   ├── (auth)/                    # Authentication routes (existing)
│   ├── (dashboard)/               # Dashboard routes (existing)
│   └── (marketing)/               # Marketing pages (existing)
│
├── modules/                       # NEW - Feature modules (to be created)
│   ├── auth/                      # Extract auth features here
│   │   ├── components/            # Auth UI components
│   │   ├── hooks/                 # Auth hooks (useAuth, useSession)
│   │   ├── services/              # JWT service, token management
│   │   ├── actions/               # Server Actions for auth
│   │   ├── types/                 # Auth types
│   │   ├── utils/                 # JWT utils, validators
│   │   └── index.ts               # Public API
│   │
│   ├── products/                  # Extract product features here
│   ├── orders/                    # Extract order features here
│   ├── user/                      # Extract user features here
│   └── [other-features]/
│
├── components/                    # Existing components
│   ├── ui/                        # Shadcn components (existing or to add)
│   └── layout/                    # Shared layouts (keep here)
│
├── lib/                           # Existing utilities (preserve)
│   ├── supabase/                  # Supabase clients (existing)
│   ├── jwt/                       # JWT utilities (preserve as-is)
│   ├── validation/                # Validation schemas
│   └── utils/                     # Helper functions
│
├── hooks/                         # Shared hooks (preserve)
├── types/                         # Shared types (preserve + expand)
└── supabase/                      # Database migrations (existing)
```

---

## MCP Integration Protocol

### Supabase MCP (Read-Only Database Analysis)

**Purpose**: Analyze existing database schema, identify optimization opportunities, generate migration scripts

**Usage Instructions**:
1. **Query Existing Schema**
   - Read current table structures, columns, types
   - Analyze existing indexes and relationships
   - Review current RLS policies
   - Document current database patterns

2. **Generate Optimization Scripts**
   - Identify missing indexes on foreign keys or frequently queried columns
   - Suggest performance improvements
   - Recommend additional RLS policies for better security
   - Propose database functions to reduce client-side logic

3. **Output Format**
   ```sql
   -- Migration Script: [description]
   -- To be executed manually in Supabase Dashboard
   -- Date: [current-date]
   
   -- [SQL statements here]
   ```

4. **Validation Queries**
   - Provide SELECT queries to validate schema changes
   - Include rollback scripts for each migration
   - Document expected impact of changes

**Important**: All migration scripts must be provided as code blocks for user to execute manually. Never attempt to execute migrations directly.

### Context7 MCP (Documentation Validation)

**Purpose**: Validate refactoring patterns against latest Next.js best practices

**Usage Instructions**:
1. **Before Module Extraction**
   - Query: "Latest Next.js App Router patterns for [feature]"
   - Query: "Server Components vs Client Components best practices"
   - Query: "Server Actions implementation patterns"
   - Query: "Next.js middleware for custom JWT auth"

2. **During Refactoring**
   - Validate data fetching strategies
   - Confirm proper use of 'use client' directive
   - Check caching and revalidation patterns
   - Verify middleware implementation for JWT

3. **After Module Creation**
   - Validate module structure against best practices
   - Confirm proper separation of concerns
   - Check for performance anti-patterns

### Shadcn MCP (UI Component Standardization)

**Purpose**: Identify existing UI components and standardize with Shadcn

**Usage Instructions**:
1. **Component Audit**
   - List all existing custom UI components
   - Identify which have Shadcn equivalents
   - Map component props to Shadcn versions
   - Plan gradual replacement strategy

2. **Install Required Components**
   - Install Shadcn components matching existing functionality
   - Ensure design tokens match current theme
   - Customize Shadcn components to match existing styles

3. **Gradual Replacement**
   - Replace custom components one at a time
   - Maintain existing functionality exactly
   - Update all imports after replacement
   - Remove old component after validation

---

## Refactoring Workflow

### Phase 1: Deep Analysis (Required First Step)

**Task 1.1: Codebase Audit**
- Scan entire project tree
- List all files in `app/`, `components/`, `lib/`, `pages/`, `api/`
- Identify all React components and their locations
- Map all API routes and data fetching patterns
- Document all database queries and Supabase usage
- List all state management implementations
- Identify all authentication/authorization code

**Task 1.2: Dependency Mapping**
- Build complete component dependency graph
- Identify circular dependencies
- Find tightly coupled components
- Locate shared utilities and helpers
- Document prop drilling patterns
- Map context provider hierarchy

**Task 1.3: Feature Identification**
Based on existing code, identify distinct features:
- What does each route/page do?
- What components belong to each feature?
- What data does each feature manage?
- What API calls does each feature make?
- How do features interact with each other?

**Task 1.4: Current Auth Analysis**
- Document existing JWT implementation
- Identify token generation logic
- Map session management approach
- Find authorization middleware
- Document protected route patterns
- List auth-related utilities

**Task 1.5: Database Schema Review**
Using Supabase MCP:
- Read complete current schema
- Document all tables, columns, relationships
- Review existing RLS policies
- Identify missing indexes
- Analyze query patterns in code
- Suggest optimizations (output as scripts)

**Task 1.6: State Management Assessment**
- Identify all Context providers
- Document Redux/Zustand stores if present
- Map global state usage patterns
- Find components using global state
- Plan state elimination strategy

---

### Phase 2: Planning & Setup

**Task 2.1: Module Boundary Definition**
Create module manifest documenting:
```markdown
## Module: [name]
- **Purpose**: [what it does]
- **Current Files**: [list files to extract]
- **Components**: [list components]
- **Routes**: [affected routes]
- **Database Tables**: [tables used]
- **Dependencies**: [what it depends on]
- **Dependents**: [what depends on it]
- **Migration Priority**: [high/medium/low]
```

**Task 2.2: Create Modular Directory Structure**
- Create `modules/` directory
- Create subdirectories for each identified module
- Set up template structure in each module
- Create index.ts files for public APIs
- Add TypeScript path aliases in tsconfig.json

**Task 2.3: Shadcn Component Audit**
- List all custom UI components in current codebase
- Map to Shadcn equivalents: `CustomButton` → `@/components/ui/button`
- Install required Shadcn components
- Create migration plan for each component

**Task 2.4: Database Optimization Plan**
Using Supabase MCP analysis, generate:
```sql
-- optimization-001-indexes.sql
-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_[table]_[column] 
ON [table]([column]);

-- optimization-002-rls.sql  
-- Improve RLS policies
CREATE POLICY "[descriptive_name]"
ON [table] FOR [operation]
USING ([condition]);
```

---

### Phase 3: Auth Module Extraction (First Priority)

**Task 3.1: Analyze Current Auth Implementation**
- Find all JWT-related code
- Locate token generation functions
- Identify session management logic
- Map middleware implementations
- Document protected route patterns

**Task 3.2: Create Auth Module Structure**
```
modules/auth/
├── components/          # Extract LoginForm, SignupForm, etc.
├── hooks/              # Extract useAuth, useSession, etc.
├── services/           # JWT service, token management
├── actions/            # Server Actions for login, logout, etc.
├── middleware/         # Auth middleware (if module-specific)
├── types/              # Auth types (User, Session, Token)
├── utils/              # JWT utilities, validators
└── index.ts            # Public API
```

**Task 3.3: Extract Auth Components**
- Move login/signup forms to `modules/auth/components/`
- Replace custom UI with Shadcn components
- Keep all functionality identical
- Update imports to use Shadcn
- Ensure forms still work with existing JWT flow

**Task 3.4: Create Auth Service Layer**
Extract existing auth logic into service:
```typescript
// modules/auth/services/authService.ts
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Move existing login logic here
    // Keep JWT generation/validation as-is
  },
  
  async verifyToken(token: string): Promise<User | null> {
    // Move existing token verification here
  },
  
  async refreshToken(token: string): Promise<string> {
    // Move token refresh logic here
  },
};
```

**Task 3.5: Create Auth Server Actions**
```typescript
// modules/auth/actions/authActions.ts
'use server';

export async function loginAction(formData: FormData) {
  // Call existing JWT auth logic
  // Keep current implementation
  // Add revalidation
}
```

**Task 3.6: Create Auth Hook**
```typescript
// modules/auth/hooks/useAuth.ts
'use client';

export function useAuth() {
  // Extract existing auth hook logic
  // Keep JWT token management
  // Maintain existing session handling
}
```

**Task 3.7: Define Auth Public API**
```typescript
// modules/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { SignupForm } from './components/SignupForm';
export { useAuth } from './hooks/useAuth';
export { authService } from './services/authService';
export { loginAction, logoutAction } from './actions/authActions';
export type { User, Session, AuthResponse } from './types';
```

**Task 3.8: Update Auth Consumers**
- Find all files importing auth code
- Update imports to use module public API
- Test auth flow completely
- Verify JWT still works correctly
- Validate protected routes still work

---

### Phase 4: Feature Module Extraction (Iterative)

**For Each Remaining Module, Follow This Process:**

**Task 4.1: Module-Specific Analysis**
- List all files belonging to this feature
- Identify all components to extract
- Map all database queries used
- Document all API routes/Server Actions
- Find dependencies on other code

**Task 4.2: Create Module Structure**
- Create module directory
- Set up subdirectories (components, hooks, services, actions, types, utils)
- Create index.ts

**Task 4.3: Extract Components**
- Move components to module/components/
- Replace custom UI with Shadcn equivalents
- Update internal imports
- Keep functionality identical
- Remove external dependencies

**Task 4.4: Create Service Layer**
- Extract all database queries into service
- Keep Supabase client calls
- Remove dependencies on other modules
- Use dependency injection pattern
- Return typed data

**Task 4.5: Create Server Actions**
- Extract or create Server Actions for mutations
- Move logic from API routes to Server Actions
- Add proper revalidation
- Handle errors appropriately

**Task 4.6: Create Custom Hooks**
- Extract data fetching hooks
- Remove dependencies on global state
- Accept dependencies as parameters
- Return stable references

**Task 4.7: Define Module Types**
- Create TypeScript interfaces
- Document all data shapes
- Export from module/types/

**Task 4.8: Define Public API**
- Export only what external code needs
- Hide internal implementation
- Document exported items

**Task 4.9: Update Consumers**
- Find all imports of extracted code
- Update to use module public API
- Test all functionality
- Validate no regressions

**Task 4.10: Validate Independence**
- Verify module has no imports from other modules
- Check only imports from shared (lib, components/ui, hooks, types)
- Test module can work standalone
- Validate TypeScript compilation

---

### Phase 5: State Management Elimination

**Task 5.1: Context Provider Analysis**
- List all Context providers
- Document what state they manage
- Find all consumers of each context
- Plan elimination strategy

**Task 5.2: Convert to Props/Server State**
For each Context:
- Move data fetching to Server Components where possible
- Pass data via props to Client Components
- Use URL state for filters/pagination
- Use React hooks (useState) for local UI state
- Remove Context provider after migration

**Task 5.3: Redux/Zustand Removal** (if applicable)
- Move server data to Server Components
- Convert to URL state or props
- Keep only transient UI state in client
- Remove store dependencies
- Delete store files after migration

---

### Phase 6: API Routes Migration

**Task 6.1: API Route Audit**
- List all files in `app/api/` or `pages/api/`
- Categorize: mutations vs queries vs webhooks
- Document what each route does
- Identify which module they belong to

**Task 6.2: Convert to Server Actions**
For routes that are mutations:
- Create Server Action in appropriate module
- Move business logic to Server Action
- Add revalidation logic
- Update form submissions to use action
- Test functionality
- Remove old API route

**Task 6.3: Keep Route Handlers**
For routes that must remain:
- External webhooks (Stripe, etc.)
- Third-party integrations
- File uploads
- OAuth callbacks

Move Route Handlers to appropriate module if possible.

---

### Phase 7: Shared Code Organization

**Task 7.1: Identify Truly Shared Code**
Code qualifies as shared if:
- Used by 3+ modules
- Has zero feature-specific logic
- Is a pure utility or UI primitive
- Has no module dependencies

**Task 7.2: Organize Shared Utilities**
- Keep in `lib/` directory
- Group by purpose (validation, formatting, api, etc.)
- Document usage
- Export properly

**Task 7.3: Organize Shared Hooks**
- Keep in `hooks/` directory
- Make hooks pure and reusable
- Accept dependencies as parameters
- Document usage

**Task 7.4: Organize Shared Types**
- Keep in `types/` directory
- Include database types from Supabase
- Add common interfaces
- Export clearly

**Task 7.5: Organize Shared Components**
- Keep Shadcn components in `components/ui/`
- Keep layout components in `components/layout/`
- Remove feature-specific components
- Ensure components are truly reusable

---

### Phase 8: Route Restructuring

**Task 8.1: Analyze Current Routes**
- List all routes in `app/` or `pages/`
- Document what each route renders
- Identify which module each route uses
- Map data fetching patterns

**Task 8.2: Update Route Imports**
- Change imports to use module public APIs
- Remove direct component imports
- Use barrel exports (module/index.ts)
- Verify routes still work

**Task 8.3: Optimize Data Fetching**
- Move data fetching to Server Components
- Use Server Actions for mutations
- Remove client-side API calls where possible
- Add proper loading states
- Implement error boundaries

---

### Phase 9: Database Optimization

**Task 9.1: Generate Index Scripts**
Using Supabase MCP analysis:
```sql
-- Script: add-performance-indexes.sql
-- Description: Add missing indexes for frequently queried columns
-- Execute in: Supabase Dashboard → SQL Editor

-- Add index on foreign keys
CREATE INDEX IF NOT EXISTS idx_products_user_id 
ON products(user_id);

-- Add index on timestamp queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_order_items_lookup 
ON order_items(order_id, product_id);
```

**Task 9.2: Generate RLS Improvement Scripts**
```sql
-- Script: improve-rls-policies.sql
-- Description: Enhance security with better RLS policies
-- Execute in: Supabase Dashboard → SQL Editor

-- More restrictive read policy
CREATE POLICY "Users can only read their own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Prevent unauthorized updates
CREATE POLICY "Users can only update their own records"
ON table_name FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Task 9.3: Generate Function Scripts**
```sql
-- Script: add-database-functions.sql
-- Description: Move business logic to database
-- Execute in: Supabase Dashboard → SQL Editor

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_table_modtime
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
```

**Task 9.4: Provide Validation Queries**
```sql
-- Validation: Check index was created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE indexname = 'idx_products_user_id';

-- Validation: Check policy exists
SELECT policyname, tablename 
FROM pg_policies 
WHERE policyname = 'Users can only read their own data';
```

---

### Phase 10: Testing & Validation

**Task 10.1: Module Independence Testing**
For each module:
- Verify no imports from other modules
- Check only imports from shared code
- Test module builds without errors
- Validate TypeScript compilation
- Check no circular dependencies

**Task 10.2: Functionality Testing**
- Test all user flows end-to-end
- Verify authentication still works (JWT)
- Test all CRUD operations
- Validate form submissions
- Check error handling
- Test loading states

**Task 10.3: Performance Testing**
- Measure page load times
- Check bundle sizes
- Validate database query performance
- Test with production data volumes
- Identify bottlenecks

**Task 10.4: Security Validation**
- Test RLS policies with different users
- Verify JWT token validation
- Test protected routes
- Validate authorization checks
- Check for data leaks

---

### Phase 11: Cleanup

**Task 11.1: Remove Deprecated Code**
After validation:
- Delete old API routes (if converted)
- Remove old component files (if extracted)
- Delete unused utilities
- Remove old state management code
- Clean up unused dependencies

**Task 11.2: Update Documentation**
- Document new module structure
- Update README with architecture
- Create module documentation
- Document public APIs
- Add migration notes

**Task 11.3: Optimize Imports**
- Remove unused imports
- Organize import statements
- Use barrel exports consistently
- Clean up tsconfig paths

---

## Module Development Standards

### Module Structure Template
```
modules/[feature-name]/
├── components/              # Feature UI components
│   ├── FeatureList.tsx
│   ├── FeatureForm.tsx
│   └── FeatureCard.tsx
├── hooks/                   # Feature-specific hooks
│   └── useFeature.ts
├── services/                # Database operations
│   └── featureService.ts
├── actions/                 # Server Actions
│   └── featureActions.ts
├── types/                   # TypeScript definitions
│   └── index.ts
├── utils/                   # Feature utilities
│   └── validators.ts
└── index.ts                 # Public API exports
```

### Service Layer Pattern (Keep Supabase)
```typescript
// modules/products/services/productService.ts
import { createClient } from '@/lib/supabase/client';
import type { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
};
```

### Server Actions Pattern
```typescript
// modules/products/actions/productActions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  
  const product = {
    name: formData.get('name') as string,
    price: parseFloat(formData.get('price') as string),
  };

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard/products');
  return { success: true, data };
}
```

### Component Pattern (Using Shadcn)
```typescript
// modules/products/components/ProductForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
});

export function ProductForm({ onSubmit, initialData }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields using Shadcn components */}
      </form>
    </Form>
  );
}
```

### Public API Pattern
```typescript
// modules/products/index.ts
// Export only what external code needs to use

export { ProductList } from './components/ProductList';
export { ProductForm } from './components/ProductForm';
export { ProductCard } from './components/ProductCard';
export { useProducts } from './hooks/useProducts';
export { productService } from './services/productService';
export { createProduct, updateProduct, deleteProduct } from './actions/productActions';
export type { Product, ProductFormData } from './types';

// Internal components, utilities, and helpers are NOT exported
```

---

## Critical Rules

### Module Independence
- ❌ **NEVER** import from other modules
- ✅ **ONLY** import from: `components/ui/`, `components/layout/`, `lib/`, `hooks/`, `types/`
- ✅ Pass dependencies via props or parameters
- ✅ Use dependency injection pattern

### Authentication
- ❌ **DO NOT** replace existing JWT auth
- ✅ **KEEP** current JWT implementation
- ✅ **OPTIMIZE** if possible (better token refresh, caching, etc.)
- ✅ Extract JWT logic into auth module

### Database Operations
- ❌ **DO NOT** execute migrations via MCP
- ✅ **GENERATE** SQL scripts for manual execution
- ✅ **PROVIDE** rollback scripts
- ✅ **INCLUDE** validation queries
- ✅ Keep using Supabase client

### Refactoring Approach
- ❌ **DO NOT** rebuild from scratch
- ✅ **EXTRACT** incrementally
- ✅ **VALIDATE** after each module
- ✅ **MAINTAIN** all existing functionality
- ✅ Test thoroughly before proceeding

---

## Output Format Standards

### Migration Script Format
```sql
-- ============================================
-- Migration: [descriptive-name]
-- Date: [YYYY-MM-DD]
-- Module: [module-name]
-- Description: [what this does]
-- ============================================

-- EXECUTE THIS IN: Supabase Dashboard → SQL Editor

-- [SQL statements]

-- ============================================
-- Validation Query
-- ============================================
-- [SELECT query to verify changes]

-- ============================================
-- Rollback Script (if needed)
-- ============================================
-- [SQL to undo changes]
```

### Module Extraction Report
After extracting each module, provide:
```markdown
## Module: [name]

### Extracted Files
- [list files moved]

### Public API
- Components: [list]
- Hooks: [list]
- Services: [list]
- Actions: [list]
- Types: [list]

### Dependencies
- Shared Components: [list]
- Shared Utilities: [list]
- External Dependencies: [list]

### Files Updated (Consumers)
- [list files that import from this module]

### Validation
- [x] No cross-module imports
- [x] TypeScript compiles
- [x] All tests pass
- [x] Functionality preserved
```

---

## Validation Checklist

### Per Module
- [ ] All module files in correct subdirectories
- [ ] Public API via index.ts only
- [ ] Zero imports from other modules
- [ ] TypeScript compilation successful
- [ ] All functionality working
- [ ] Tests passing
- [ ] No regressions introduced

### Overall Project
- [ ] All modules extracted
- [ ] All API routes migrated or kept intentionally
- [ ] State management eliminated (Context/Redux)
- [ ] All routes updated to use module APIs
- [ ] Database optimization scripts generated
- [ ] All tests passing
- [ ] Performance maintained or improved
- [ ] Documentation updated
- [ ] JWT auth still working correctly

---

## Agent Execution Protocol

### Always Follow This Order:
1. **Analyze** - Deep codebase analysis first
2. **Plan** - Document module boundaries and dependencies
3. **Extract Auth** - Auth module first (highest priority)
4. **Extract Features** - One module at a time
5. **Eliminate State** - Remove global state management
6. **Migrate Routes** - Update to use module APIs
7. **Optimize Database** - Generate optimization scripts
8. **Test** - Validate everything works
9. **Cleanup** - Remove deprecated code
10. **Document** - Update all documentation

### For Each Module:
1. Analyze what needs extraction
2. Create module structure
3. Extract components (replace with Shadcn)
4. Create service layer
5. Create Server Actions
6. Create hooks
7. Define types
8. Create public API
9. Update consumers
10. Validate independence
11. Test functionality

### Never:
- Skip analysis phase
- Extract multiple modules simultaneously
- Replace JWT auth
- Execute migrations directly
- Break existing functionality
- Create cross-module dependencies
- Rebuild from scratch

---

## Success Criteria

Refactoring is complete when:
1. ✅ All features work identically to before
2. ✅ Each module is self-contained
3. ✅ Zero cross-module imports
4. ✅ JWT auth working as before
5. ✅ All global state eliminated
6. ✅ Database optimization scripts provided
7. ✅ All routes using module APIs
8. ✅ Shadcn components replacing custom UI
9. ✅ TypeScript compiles without errors
10. ✅ All tests passing
11. ✅ Performance maintained or improved
12. ✅ Documentation updated
13. ✅ Code maintainability significantly improved
14. ✅ New features can be added as isolated modules