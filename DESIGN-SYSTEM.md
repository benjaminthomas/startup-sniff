# UI Design System

> Based on the influencer marketing dashboard design - A comprehensive design system for building consistent, beautiful interfaces.

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Components](#components)
5. [Shadows & Elevation](#shadows--elevation)
6. [Border Radius](#border-radius)
7. [Icons](#icons)
8. [Layout Patterns](#layout-patterns)

---

## Color Palette

### Primary Colors
```css
--primary-500: #2D6EF7;     /* Main brand blue - buttons, links, primary actions */
--primary-600: #1E5EE8;     /* Hover state for primary */
--primary-700: #1A4FC4;     /* Active/pressed state */
--primary-400: #4D85F9;     /* Lighter variant */
--primary-300: #6F9DFA;     /* Very light variant */
```

### Semantic Colors
```css
/* Success */
--success-500: #10B981;     /* Green for success states */
--success-50: #D1FAE5;      /* Success background */

/* Warning */
--warning-500: #F59E0B;     /* Orange for warnings */
--warning-50: #FEF3C7;      /* Warning background */

/* Error/Danger */
--error-500: #EF4444;       /* Red for errors, critical actions */
--error-50: #FEE2E2;        /* Error background */

/* Info */
--info-500: #3B82F6;        /* Blue for informational states */
--info-50: #DBEAFE;         /* Info background */
```

### Neutral Colors
```css
--neutral-900: #111827;     /* Primary text color */
--neutral-800: #1F2937;     /* Secondary text */
--neutral-700: #374151;     /* Tertiary text */
--neutral-600: #4B5563;     /* Muted text */
--neutral-500: #6B7280;     /* Placeholder text */
--neutral-400: #9CA3AF;     /* Disabled text */
--neutral-300: #D1D5DB;     /* Borders */
--neutral-200: #E5E7EB;     /* Dividers */
--neutral-100: #F3F4F6;     /* Background gray */
--neutral-50: #F9FAFB;      /* Light background */
--white: #FFFFFF;           /* Pure white */
```

### Social Media Colors
```css
--instagram: #E4405F;       /* Instagram brand color */
--facebook: #1877F2;        /* Facebook brand color */
--twitter: #1DA1F2;         /* Twitter/X brand color */
--youtube: #FF0000;         /* YouTube brand color */
--tiktok: #000000;          /* TikTok brand color */
```

---

## Typography

### Font Family
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;         /* 12px - Timestamps, labels */
--text-sm: 0.875rem;        /* 14px - Body text, descriptions */
--text-base: 1rem;          /* 16px - Default body text */
--text-lg: 1.125rem;        /* 18px - Large body text */
--text-xl: 1.25rem;         /* 20px - Small headings */
--text-2xl: 1.5rem;         /* 24px - Section headings */
--text-3xl: 1.875rem;       /* 30px - Page headings */
--text-4xl: 2.25rem;        /* 36px - Hero headings */
--text-5xl: 3rem;           /* 48px - Display headings */
```

### Font Weights
```css
--font-normal: 400;         /* Regular text */
--font-medium: 500;         /* Emphasized text */
--font-semibold: 600;       /* Headings, buttons */
--font-bold: 700;           /* Strong emphasis */
```

### Line Heights
```css
--leading-tight: 1.25;      /* Headings */
--leading-normal: 1.5;      /* Body text */
--leading-relaxed: 1.75;    /* Large paragraphs */
```

---

## Spacing System

### Base Unit: 4px

```css
--space-1: 0.25rem;         /* 4px */
--space-2: 0.5rem;          /* 8px */
--space-3: 0.75rem;         /* 12px */
--space-4: 1rem;            /* 16px */
--space-5: 1.25rem;         /* 20px */
--space-6: 1.5rem;          /* 24px */
--space-8: 2rem;            /* 32px */
--space-10: 2.5rem;         /* 40px */
--space-12: 3rem;           /* 48px */
--space-16: 4rem;           /* 64px */
--space-20: 5rem;           /* 80px */
```

### Component-Specific Spacing
```css
--card-padding: var(--space-6);         /* 24px card padding */
--sidebar-width: 256px;                 /* Fixed sidebar width */
--header-height: 72px;                  /* Fixed header height */
--button-padding-x: var(--space-4);     /* 16px horizontal button padding */
--button-padding-y: var(--space-2);     /* 8px vertical button padding */
```

---

## Components

### 1. Buttons

#### Primary Button
```tsx
<button className="btn-primary">
  Go for it!
</button>

/* Styles */
.btn-primary {
  background: var(--primary-500);
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 110, 247, 0.3);
}
```

#### Secondary Button
```tsx
<button className="btn-secondary">
  See Details
</button>

/* Styles */
.btn-secondary {
  background: transparent;
  color: var(--primary-500);
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid var(--neutral-300);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: var(--primary-50);
  border-color: var(--primary-500);
}
```

#### Text Button (Link Style)
```tsx
<button className="btn-text">
  See Campaign Details
</button>

/* Styles */
.btn-text {
  background: transparent;
  color: var(--primary-500);
  padding: 8px 12px;
  font-weight: 500;
  font-size: 14px;
  transition: color 0.2s;
}
.btn-text:hover {
  color: var(--primary-600);
  text-decoration: underline;
}
```

### 2. Cards

#### Standard Card
```tsx
<div className="card">
  <div className="card-content">
    {/* Content here */}
  </div>
</div>

/* Styles */
.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

#### Feature Card (Blue Gradient)
```tsx
<div className="card-feature">
  <h2>Let's create campaign for your amazing brand!</h2>
  <p>Quia minus veniam, eget molestie sit urna</p>
  <button className="btn-white">Go for it!</button>
</div>

/* Styles */
.card-feature {
  background: linear-gradient(135deg, #2D6EF7 0%, #1E5EE8 100%);
  border-radius: 24px;
  padding: 48px 40px;
  color: white;
}
```

#### Stat Card
```tsx
<div className="stat-card">
  <div className="stat-icon">
    <ArrowUpIcon />
  </div>
  <div className="stat-value">$12,801</div>
  <div className="stat-label">Transaction</div>
</div>

/* Styles */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900);
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### 3. Influencer Card
```tsx
<div className="influencer-card">
  <img src="/avatar.jpg" alt="Noah Verentino" className="influencer-avatar" />
  <h3 className="influencer-name">Noah Verentino</h3>
  <p className="influencer-followers">2,890,080 follower</p>
  <div className="social-icons">
    <InstagramIcon />
    <FacebookIcon />
    <TwitterIcon />
  </div>
  <button className="btn-primary btn-sm">Add to Campaign</button>
</div>

/* Styles */
.influencer-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.influencer-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}
.influencer-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
}
.influencer-followers {
  font-size: 12px;
  color: var(--neutral-500);
}
.social-icons {
  display: flex;
  gap: 8px;
}
```

### 4. Navigation Sidebar

```tsx
<aside className="sidebar">
  <div className="sidebar-header">
    <UserProfile />
  </div>
  <nav className="sidebar-nav">
    <NavItem icon={<HomeIcon />} label="Home" active />
    <NavItem icon={<CampaignIcon />} label="Campaign" />
    <NavItem icon={<PaymentIcon />} label="Payments" />
    <NavItem icon={<InfluencerIcon />} label="Influencer" />
    <NavItem icon={<SettingsIcon />} label="Settings" />
  </nav>
  <div className="sidebar-footer">
    <ProAccessCard />
  </div>
</aside>

/* Styles */
.sidebar {
  width: 256px;
  height: 100vh;
  background: white;
  border-right: 1px solid var(--neutral-200);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 32px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-600);
  transition: all 0.2s;
  cursor: pointer;
}
.nav-item:hover {
  background: var(--neutral-50);
  color: var(--neutral-900);
}
.nav-item.active {
  background: var(--primary-50);
  color: var(--primary-500);
}
```

### 5. Search Input

```tsx
<div className="search-input">
  <SearchIcon />
  <input type="text" placeholder="Search something" />
</div>

/* Styles */
.search-input {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  padding: 12px 16px;
  width: 320px;
}
.search-input input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: var(--neutral-900);
}
.search-input input::placeholder {
  color: var(--neutral-400);
}
```

### 6. Notification Item

```tsx
<div className="notification-item">
  <div className="notification-icon">
    <Avatar src="/company-logo.png" />
    <StatusBadge type="warning" />
  </div>
  <div className="notification-content">
    <p className="notification-title">
      <strong>Miniso Inc.</strong> sent you campaign request
    </p>
    <p className="notification-description">
      Lacus nunc massa magna venenatis elepisua a tempor viverrs.
    </p>
  </div>
  <div className="notification-meta">
    <span className="notification-time">2 minutes ago</span>
    <div className="notification-actions">
      <button className="btn-secondary btn-sm">Decline</button>
      <button className="btn-primary btn-sm">Accept</button>
    </div>
  </div>
</div>

/* Styles */
.notification-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--neutral-200);
  transition: background 0.2s;
}
.notification-item:hover {
  background: var(--neutral-50);
}
.notification-icon {
  position: relative;
  width: 40px;
  height: 40px;
}
.notification-content {
  flex: 1;
}
.notification-title {
  font-size: 14px;
  color: var(--neutral-900);
  margin-bottom: 4px;
}
.notification-description {
  font-size: 12px;
  color: var(--neutral-500);
}
.notification-time {
  font-size: 12px;
  color: var(--neutral-400);
}
```

### 7. Pro Access Card

```tsx
<div className="pro-access-card">
  <h3>Become Pro Access</h3>
  <p>Try our experience for using more features</p>
  <button className="btn-white">
    <StarIcon /> Upgrade Pro
  </button>
</div>

/* Styles */
.pro-access-card {
  background: linear-gradient(135deg, #2D6EF7 0%, #1E5EE8 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  text-align: center;
}
.pro-access-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.pro-access-card p {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 16px;
}
.btn-white {
  background: white;
  color: var(--primary-500);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

---

## Shadows & Elevation

```css
/* Shadows */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.08);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.15);

/* Elevation Levels */
Level 0: No shadow (flush with surface)
Level 1: --shadow-sm (cards at rest)
Level 2: --shadow-md (cards on hover, dropdowns)
Level 3: --shadow-lg (modals, popovers)
Level 4: --shadow-xl (tooltips, floating elements)
Level 5: --shadow-2xl (overlays, drawers)
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;           /* Small elements */
--radius-md: 8px;           /* Buttons, inputs */
--radius-lg: 12px;          /* Cards, containers */
--radius-xl: 16px;          /* Large cards */
--radius-2xl: 24px;         /* Feature cards */
--radius-full: 9999px;      /* Pills, circles */
```

---

## Icons

### Icon Sizes
```css
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 48px;
```

### Icon Styles
- **Style**: Outlined (line icons)
- **Stroke Width**: 1.5px - 2px
- **Library Recommendation**: Heroicons, Lucide Icons, or Phosphor Icons

### Common Icons Used
- Home
- Campaign/Megaphone
- Payments/CreditCard
- Influencer/Users
- Settings/Cog
- Search/MagnifyingGlass
- Notifications/Bell
- Arrow Up/Down (for metrics)
- Check/X (for actions)
- Instagram/Facebook/Twitter logos

---

## Layout Patterns

### 1. Dashboard Layout
```
┌─────────────────────────────────────────────────┐
│  Sidebar │         Header (Search, Notif)      │
│          ├────────────────────────────────────────┤
│  Nav     │                                      │
│  Items   │         Main Content Area           │
│          │                                      │
│  Pro     │                                      │
│  Card    │                                      │
└─────────────────────────────────────────────────┘
```

### 2. Grid Systems

#### 2-Column Grid (Stat Cards)
```css
.grid-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
```

#### 3-Column Grid (Influencer Cards)
```css
.grid-influencers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 1280px) {
  .grid-influencers {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-influencers {
    grid-template-columns: 1fr;
  }
}
```

### 3. Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## Animation & Transitions

```css
/* Durations */
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Common Transitions */
transition: all var(--duration-base) var(--ease-in-out);
```

### Hover Effects
- **Buttons**: Slight lift (translateY(-1px)) + shadow increase
- **Cards**: Shadow increase from sm → md
- **Links**: Color change + underline
- **Icons**: Color change + slight scale (1.05)

---

## Accessibility

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### Color Contrast
- Text on white background: Minimum AA rating (4.5:1)
- Large text on white background: Minimum AA rating (3:1)
- Interactive elements: Clear visual distinction

### Screen Reader Support
- Use semantic HTML elements
- Provide aria-labels for icon-only buttons
- Ensure keyboard navigation works for all interactive elements

---

## Usage Guidelines

### Do's ✅
- Use consistent spacing from the spacing system
- Maintain the color palette for consistency
- Use proper elevation levels for depth
- Follow the typography hierarchy
- Ensure sufficient color contrast
- Use rounded corners consistently
- Provide clear visual feedback for interactions

### Don'ts ❌
- Don't use arbitrary spacing values
- Don't introduce new colors outside the palette
- Don't mix border radius values inconsistently
- Don't use more than 3 font weights in a single view
- Don't create overly complex shadows
- Don't forget hover/focus states
- Don't use low-contrast color combinations

---

## Implementation Example

### React Component with Tailwind CSS
```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          300: '#6F9DFA',
          400: '#4D85F9',
          500: '#2D6EF7',
          600: '#1E5EE8',
          700: '#1A4FC4',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
};

// Component Example
export function InfluencerCard({ influencer }) {
  return (
    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <img
        src={influencer.avatar}
        alt={influencer.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <h3 className="text-sm font-semibold text-neutral-900">
        {influencer.name}
      </h3>
      <p className="text-xs text-neutral-500">
        {influencer.followers.toLocaleString()} follower
      </p>
      <div className="flex gap-2">
        {influencer.socials.map((social) => (
          <SocialIcon key={social} platform={social} />
        ))}
      </div>
      <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors">
        Add to Campaign
      </button>
    </div>
  );
}
```

---

## Resources

### Design Tools
- **Figma**: For design and prototyping
- **Tailwind CSS**: For implementation
- **shadcn/ui**: For base components
- **Radix UI**: For accessible primitives

### Icon Libraries
- [Heroicons](https://heroicons.com/)
- [Lucide Icons](https://lucide.dev/)
- [Phosphor Icons](https://phosphoricons.com/)

### Font
- [Inter](https://rsms.me/inter/) - Primary font family

---

**Version**: 1.0.0
**Last Updated**: 2025-12-17
**Maintained by**: Design Team

