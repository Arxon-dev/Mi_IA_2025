# OpositIA Design System

## Overview

This design system provides a comprehensive set of components, colors, typography, and guidelines for building consistent and beautiful user interfaces in the OpositIA educational platform. Inspired by modern minimalist design principles from Notion, Linear, and Vercel Dashboard.

## Design Principles

### 1. Minimalism
- Clean, uncluttered interfaces with abundant whitespace
- Focus on content and functionality
- Subtle visual hierarchy

### 2. Consistency
- Unified color palette across all components
- Consistent spacing and typography scales
- Predictable interaction patterns

### 3. Accessibility
- High contrast ratios for text readability
- Keyboard navigation support
- Screen reader friendly markup

### 4. Responsiveness
- Mobile-first approach
- Fluid layouts that adapt to different screen sizes
- Touch-friendly interactive elements

## Color System

### Primary Colors
```css
--primary: #6366f1        /* Indigo - Main brand color */
--primary-foreground: #ffffff
```

### Secondary Colors
```css
--secondary: #8b5cf6      /* Violet - Accent color */
--secondary-foreground: #ffffff
```

### Neutral Colors
```css
/* Light Mode */
--background: #ffffff
--foreground: #0f172a
--card: #ffffff
--card-foreground: #0f172a
--muted: #f8fafc
--muted-foreground: #64748b
--border: #e2e8f0
--accent: #f1f5f9
--accent-foreground: #0f172a

/* Dark Mode */
--background: #0f172a
--foreground: #f8fafc
--card: #1e293b
--card-foreground: #f8fafc
--muted: #1e293b
--muted-foreground: #94a3b8
--border: #334155
--accent: #1e293b
--accent-foreground: #f8fafc
```

### Semantic Colors
```css
--success: #10b981       /* Green - Success states */
--warning: #f59e0b       /* Amber - Warning states */
--destructive: #ef4444   /* Red - Error/destructive states */
```

## Typography

### Font Family
- **Primary**: Inter (system fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- **Monospace**: "Fira Code", Consolas, "Courier New", monospace

### Font Scale
```css
.text-xs     { font-size: 0.75rem; line-height: 1rem; }
.text-sm     { font-size: 0.875rem; line-height: 1.25rem; }
.text-base   { font-size: 1rem; line-height: 1.5rem; }
.text-lg     { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl     { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl    { font-size: 1.5rem; line-height: 2rem; }
.text-3xl    { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl    { font-size: 2.25rem; line-height: 2.5rem; }
```

### Font Weights
```css
.font-normal    { font-weight: 400; }
.font-medium    { font-weight: 500; }
.font-semibold  { font-weight: 600; }
.font-bold      { font-weight: 700; }
```

## Spacing System

Based on a 4px grid system:

```css
.p-1   { padding: 0.25rem; }    /* 4px */
.p-2   { padding: 0.5rem; }     /* 8px */
.p-3   { padding: 0.75rem; }    /* 12px */
.p-4   { padding: 1rem; }       /* 16px */
.p-6   { padding: 1.5rem; }     /* 24px */
.p-8   { padding: 2rem; }       /* 32px */
.p-12  { padding: 3rem; }       /* 48px */
```

## Component Library

### Button

Primary component for user actions with multiple variants and sizes.

#### Variants
- **Primary**: Main call-to-action buttons
- **Secondary**: Secondary actions
- **Outline**: Subtle actions with border
- **Ghost**: Minimal actions without background
- **Link**: Text-only actions
- **Destructive**: Dangerous actions

#### Sizes
- **sm**: Small buttons (32px height)
- **default**: Standard buttons (40px height)
- **lg**: Large buttons (48px height)

#### Usage
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="default">
  Primary Action
</Button>

<Button variant="outline" size="sm">
  Secondary Action
</Button>
```

### Card

Container component for grouping related content with consistent styling.

#### Variants
- **default**: Standard card with border
- **elevated**: Card with shadow
- **outlined**: Card with prominent border
- **ghost**: Borderless card

#### Subcomponents
- **CardHeader**: Top section with title and description
- **CardTitle**: Main heading
- **CardDescription**: Subtitle or description
- **CardContent**: Main content area
- **CardFooter**: Bottom section for actions

#### Usage
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
</Card>
```

### Input

Form input component with error states and helper text support.

#### Features
- Error state styling
- Helper text support
- Proper focus indicators
- Accessible labeling

#### Usage
```tsx
import { Input } from '@/components/ui/Input';

<Input
  type="email"
  placeholder="Enter your email"
  error="Invalid email format"
  helperText="We'll never share your email"
/>
```

### Alert

Component for displaying important messages to users.

#### Variants
- **default**: Neutral information
- **info**: Informational messages
- **warning**: Warning messages
- **error**: Error messages
- **success**: Success messages

#### Subcomponents
- **AlertTitle**: Alert heading
- **AlertDescription**: Alert content

#### Usage
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';

<Alert variant="error">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>
```

### Badge

Small component for displaying status, categories, or counts.

#### Variants
- **default**: Standard badge
- **secondary**: Muted badge
- **outline**: Bordered badge
- **destructive**: Error badge

#### Usage
```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="default">New</Badge>
<Badge variant="outline">Beta</Badge>
```

## Layout Components

### Dashboard

Main dashboard layout with statistics cards and recent documents.

#### Features
- Statistics grid with hover animations
- Recent documents list
- AI configuration status
- Responsive design

### Sidebar

Navigation sidebar with hierarchical menu structure.

#### Features
- Collapsible submenus
- Active state indicators
- Badge support for menu items
- Smooth animations

### Header

Top navigation bar with branding and user actions.

#### Features
- Responsive navigation
- Theme toggle
- Mobile menu
- User profile access

## Utility Classes

### Common Patterns

#### Cards
```css
.card {
  @apply rounded-lg border bg-card text-card-foreground shadow-sm;
}
```

#### Buttons
```css
.btn-primary {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium 
         bg-primary text-primary-foreground hover:bg-primary/90 
         h-10 px-4 py-2 transition-colors duration-200;
}
```

#### Focus States
```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}
```

## Animation Guidelines

### Transitions
- **Duration**: 200ms for most interactions
- **Easing**: ease-in-out for natural feel
- **Properties**: color, background-color, border-color, transform, opacity

### Hover Effects
- Subtle scale transforms (scale-105)
- Color transitions
- Shadow changes for elevation

### Loading States
- Spinner animations for async operations
- Skeleton screens for content loading
- Progressive disclosure

## Responsive Design

### Breakpoints
```css
sm: 640px    /* Small devices */
md: 768px    /* Medium devices */
lg: 1024px   /* Large devices */
xl: 1280px   /* Extra large devices */
2xl: 1536px  /* 2X large devices */
```

### Mobile-First Approach
- Start with mobile layout
- Progressively enhance for larger screens
- Touch-friendly interactive elements (minimum 44px)

## Dark Mode Support

### Implementation
- CSS custom properties for theme switching
- Automatic system preference detection
- Manual toggle support
- Consistent contrast ratios

### Color Adjustments
- Inverted background/foreground colors
- Adjusted opacity for overlays
- Maintained semantic color meanings

## Accessibility

### Color Contrast
- Minimum 4.5:1 ratio for normal text
- Minimum 3:1 ratio for large text
- High contrast mode support

### Keyboard Navigation
- Tab order follows visual hierarchy
- Focus indicators on all interactive elements
- Escape key closes modals/dropdowns

### Screen Readers
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content

## Best Practices

### Component Usage
1. Use semantic HTML elements
2. Implement proper ARIA attributes
3. Follow consistent naming conventions
4. Maintain component isolation

### Performance
1. Lazy load non-critical components
2. Optimize images and assets
3. Use CSS-in-JS sparingly
4. Minimize bundle size

### Maintenance
1. Document component changes
2. Update design tokens consistently
3. Test across different devices
4. Regular accessibility audits

## Future Enhancements

### Planned Components
- Data tables with sorting/filtering
- Modal dialogs and overlays
- Toast notifications
- Progress indicators
- Date/time pickers

### Design Tokens
- Centralized design token system
- Automated design-to-code workflow
- Cross-platform consistency

This design system serves as the foundation for building consistent, accessible, and beautiful user interfaces in the OpositIA platform. Regular updates and community feedback help maintain its relevance and effectiveness. 