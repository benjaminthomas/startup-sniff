# Design System Components

A collection of React components based on the influencer marketing dashboard design. These components follow a consistent design language with a modern blue color scheme.

## Quick Start

```tsx
import {
  InfluencerCard,
  FeatureCard,
  StatCard,
  NotificationItem,
  ProAccessCard,
  SearchInput
} from '@/components/design-system';
```

## Components

### 1. InfluencerCard

Display influencer profiles with avatar, follower count, social media icons, and CTA button.

```tsx
<InfluencerCard
  influencer={{
    id: '1',
    name: 'Noah Verentino',
    avatar: '/avatars/noah.jpg',
    followers: 2890080,
    socials: ['instagram', 'facebook', 'twitter']
  }}
  onAddToCampaign={(id) => handleAddToCampaign(id)}
/>
```

**Props:**
- `influencer` - Object containing influencer data
  - `id` (string) - Unique identifier
  - `name` (string) - Influencer name
  - `avatar` (string) - Avatar image URL
  - `followers` (number) - Follower count
  - `socials` (array) - Array of social platforms
- `onAddToCampaign` - Optional callback when button is clicked

---

### 2. FeatureCard

Large promotional card with gradient background for highlighting features or CTAs.

```tsx
<FeatureCard
  title="Let's create campaign for your amazing brand!"
  description="Quia minus veniam, eget molestie sit urna"
  buttonText="Go for it!"
  onButtonClick={() => handleCreateCampaign()}
/>
```

**Props:**
- `title` (string) - Main heading
- `description` (string) - Supporting text
- `buttonText` (string) - CTA button text (default: "Get Started")
- `onButtonClick` - Optional callback when button is clicked
- `className` - Optional additional CSS classes

---

### 3. StatCard

Display key metrics and statistics with optional trend indicators.

```tsx
<StatCard
  label="Transaction"
  value="$12,801"
  trend="up"
  trendValue="+12.5%"
  icon={<DollarSign size={20} />}
  iconColor="success"
/>
```

**Props:**
- `label` (string) - Metric label (displayed below value)
- `value` (string | number) - The main metric value
- `trend` - Optional: 'up' | 'down' | 'neutral'
- `trendValue` (string) - Optional trend percentage/value
- `icon` (ReactNode) - Optional icon to display
- `iconColor` - Optional: 'success' | 'error' | 'warning' | 'primary'
- `className` - Optional additional CSS classes

---

### 4. NotificationItem

Display notification messages with avatar, timestamp, and action buttons.

```tsx
<NotificationItem
  id="notif-1"
  avatar="/logos/miniso.png"
  company="Miniso Inc."
  message="sent you campaign request"
  description="Lacus nunc massa magna venenatis elepisua a tempor viverrs."
  timestamp="2 minutes ago"
  status="warning"
  onAccept={(id) => handleAccept(id)}
  onDecline={(id) => handleDecline(id)}
/>
```

**Props:**
- `id` (string) - Unique notification identifier
- `avatar` (string) - Company/user avatar URL
- `company` (string) - Company/user name
- `message` (string) - Notification message
- `description` (string) - Additional details
- `timestamp` (string) - Time/date string
- `status` - Optional: 'warning' | 'success' | 'error' | 'info'
- `onAccept` - Optional accept callback
- `onDecline` - Optional decline callback
- `showActions` (boolean) - Show/hide action buttons (default: true)

---

### 5. ProAccessCard

Upgrade/upsell card for promoting premium features.

```tsx
<ProAccessCard
  title="Become Pro Access"
  description="Try our experience for using more features"
  buttonText="Upgrade Pro"
  onUpgrade={() => handleUpgrade()}
/>
```

**Props:**
- `title` (string) - Card title (default: "Become Pro Access")
- `description` (string) - Supporting text
- `buttonText` (string) - Button text (default: "Upgrade Pro")
- `icon` (ReactNode) - Optional icon for button (default: Sparkles)
- `onUpgrade` - Optional callback when button is clicked
- `className` - Optional additional CSS classes

---

### 6. SearchInput

Styled search input with icon and keyboard support.

```tsx
<SearchInput
  placeholder="Search influencers"
  onChange={(value) => handleSearch(value)}
  onSearch={(value) => handleExecuteSearch(value)}
/>
```

**Props:**
- `placeholder` (string) - Placeholder text (default: "Search something")
- `value` (string) - Controlled value
- `onChange` - Callback fired on input change
- `onSearch` - Callback fired on Enter key press
- `className` - Optional additional CSS classes

---

## Design Tokens

All components use consistent design tokens defined in `/styles/design-tokens.css`:

### Colors
- **Primary Blue**: `#2D6EF7` - Main brand color
- **Primary Blue Hover**: `#1E5EE8`
- **Success Green**: `#10B981`
- **Warning Orange**: `#F59E0B`
- **Error Red**: `#EF4444`
- **Neutral Grays**: `#F9FAFB` to `#111827`

### Social Media Colors
- Instagram: `#E4405F`
- Facebook: `#1877F2`
- Twitter: `#1DA1F2`

### Typography
- Font Family: Inter, system fonts
- Sizes: 12px (xs) to 48px (5xl)
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
Based on 4px increments (4px, 8px, 12px, 16px, 24px, etc.)

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 12px
- XL: 16px
- 2XL: 24px
- Full: 9999px (circles)

### Shadows
```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05)
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.05)
--shadow-primary: 0 4px 12px rgba(45, 110, 247, 0.3)
```

---

## Example Page Layout

Here's an example of combining components to create a dashboard:

```tsx
import {
  InfluencerCard,
  FeatureCard,
  StatCard,
  SearchInput
} from '@/components/design-system';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Dashboard
        </h1>
        <SearchInput
          placeholder="Search campaigns or influencers"
          onSearch={(q) => console.log('Search:', q)}
        />
      </div>

      {/* Feature Card */}
      <div className="mb-8">
        <FeatureCard
          title="Let's create campaign for your amazing brand!"
          description="Quia minus veniam, eget molestie sit urna"
          buttonText="Go for it!"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Total Revenue"
          value="$12,801"
          trend="up"
          trendValue="+12.5%"
          icon={<DollarSign size={20} />}
          iconColor="success"
        />
        <StatCard
          label="Active Campaigns"
          value="$60,325"
          trend="up"
          trendValue="+8.2%"
          icon={<TrendingUp size={20} />}
          iconColor="primary"
        />
        <StatCard
          label="Total Reach"
          value="120 times"
          icon={<Users size={20} />}
          iconColor="warning"
        />
      </div>

      {/* Influencers Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Influencers</h2>
          <button className="text-primary-500 text-sm font-medium">
            See All Influencer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfluencerCard
            influencer={{
              id: '1',
              name: 'Noah Verentino',
              avatar: '/avatars/1.jpg',
              followers: 2890080,
              socials: ['instagram', 'facebook', 'twitter']
            }}
          />
          <InfluencerCard
            influencer={{
              id: '2',
              name: 'Xie Cia No',
              avatar: '/avatars/2.jpg',
              followers: 2890080,
              socials: ['instagram', 'facebook']
            }}
          />
          <InfluencerCard
            influencer={{
              id: '3',
              name: 'Zahra Aulia',
              avatar: '/avatars/3.jpg',
              followers: 2890080,
              socials: ['instagram', 'twitter']
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Responsive Behavior

All components are designed to be responsive:

- **InfluencerCard**: Stack in grid layouts (3 cols → 2 cols → 1 col)
- **FeatureCard**: Full width on mobile, maintains padding
- **StatCard**: Grid adapts from 3 columns to 1 column
- **NotificationItem**: Stacks actions below on small screens
- **SearchInput**: Full width on mobile

Recommended breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## Accessibility

All components follow accessibility best practices:

- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ Semantic HTML structure
- ✅ ARIA labels where appropriate
- ✅ Color contrast meets WCAG AA standards
- ✅ Screen reader friendly

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Customization

All components accept a `className` prop for additional styling:

```tsx
<InfluencerCard
  className="border-2 border-primary-500"
  {...props}
/>
```

You can also override design tokens in your CSS:

```css
:root {
  --primary-500: #YOUR_COLOR; /* Override primary color */
}
```

---

## Related Documentation

- [Full Design System Documentation](../../DESIGN-SYSTEM.md)
- [Design Tokens](../../styles/design-tokens.css)
- [Tailwind Configuration](../../app/globals.css)

---

## License

MIT License - Feel free to use these components in your projects!
