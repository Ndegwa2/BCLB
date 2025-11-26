# UI/UX Design System Specifications

This document provides comprehensive design system specifications for implementing the Gaming Platform frontend with Tailwind CSS.

## Color System

### Primary Colors
```css
/* Brand Colors */
--primary-50: #eff6ff;    /* Lightest blue */
--primary-100: #dbeafe;   /* Light blue */
--primary-200: #bfdbfe;   /* Lighter blue */
--primary-300: #93c5fd;   /* Light blue */
--primary-400: #60a5fa;   /* Medium light blue */
--primary-500: #3b82f6;   /* Primary blue - MAIN BRAND COLOR */
--primary-600: #2563eb;   /* Medium dark blue */
--primary-700: #1d4ed8;   /* Dark blue */
--primary-800: #1e40af;   /* Darker blue */
--primary-900: #1e3a8a;   /* Darkest blue */
```

### Semantic Colors
```css
/* Success Colors */
--success-50: #ecfdf5;
--success-100: #d1fae5;
--success-500: #10b981;   /* SUCCESS GREEN */
--success-600: #059669;
--success-700: #047857;

/* Warning Colors */
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b;   /* WARNING ORANGE */
--warning-600: #d97706;

/* Error Colors */
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444;     /* ERROR RED */
--error-600: #dc2626;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;      /* Dark gray for headers */
--gray-900: #111827;      /* Darkest gray for text */
```

### Game Type Colors
```css
/* Game-specific brand colors */
--draw-blue: #3b82f6;     /* Draw 1v1 games */
--pool-yellow: #f59e0b;   /* Pool 8ball games */
--blackjack-purple: #8b5cf6; /* Blackjack games */
--tournament-gold: #eab308;  /* Tournament elements */
```

### Tailwind Config Color Mapping
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        game: {
          draw: '#3b82f6',
          pool: '#f59e0b',
          blackjack: '#8b5cf6',
          tournament: '#eab308',
        },
      },
    },
  },
};
```

## Typography System

### Font Families
```css
/* Primary Font Stack */
--font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Monospace Font for codes */
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
```

### Font Sizes & Weights
```javascript
// Typography scale
{
  // Font sizes
  text-xs: 12px,     // 0.75rem    - Small labels, captions
  text-sm: 14px,     // 0.875rem   - Body text, labels
  text-base: 16px,   // 1rem       - Default text size
  text-lg: 18px,     // 1.125rem   - Large body text
  text-xl: 20px,     // 1.25rem    - Small headings
  text-2xl: 24px,    // 1.5rem     - Medium headings
  text-3xl: 30px,    // 1.875rem   - Large headings
  text-4xl: 36px,    // 2.25rem    - Hero headings
  text-5xl: 48px,    // 3rem       - Display headings
  
  // Font weights
  font-light: 300,
  font-normal: 400,
  font-medium: 500,
  font-semibold: 600,
  font-bold: 700,
  font-extrabold: 800,
}
```

### Typography Classes
```css
/* Heading Styles */
.heading-xl {
  font-size: 2.25rem;    /* 36px */
  font-weight: 700;
  line-height: 1.2;
  color: var(--gray-900);
}

.heading-lg {
  font-size: 1.875rem;   /* 30px */
  font-weight: 600;
  line-height: 1.3;
  color: var(--gray-900);
}

.heading-md {
  font-size: 1.5rem;     /* 24px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--gray-800);
}

.heading-sm {
  font-size: 1.25rem;    /* 20px */
  font-weight: 600;
  line-height: 1.4;
  color: var(--gray-800);
}

/* Body Text Styles */
.text-large {
  font-size: 1.125rem;   /* 18px */
  font-weight: 400;
  line-height: 1.6;
  color: var(--gray-700);
}

.text-body {
  font-size: 1rem;       /* 16px */
  font-weight: 400;
  line-height: 1.6;
  color: var(--gray-700);
}

.text-small {
  font-size: 0.875rem;   /* 14px */
  font-weight: 400;
  line-height: 1.5;
  color: var(--gray-600);
}

.text-xs {
  font-size: 0.75rem;    /* 12px */
  font-weight: 400;
  line-height: 1.4;
  color: var(--gray-500);
}

/* Text Colors */
.text-primary { color: var(--primary-500); }
.text-success { color: var(--success-500); }
.text-warning { color: var(--warning-500); }
.text-error { color: var(--error-500); }
.text-muted { color: var(--gray-500); }
.text-dark { color: var(--gray-900); }
```

## Spacing System

### Spacing Scale
```javascript
{
  // Spacing units (based on 4px grid)
  0: 0,
  1: 0.25rem,    // 4px
  2: 0.5rem,     // 8px
  3: 0.75rem,    // 12px
  4: 1rem,       // 16px
  5: 1.25rem,    // 20px
  6: 1.5rem,     // 24px
  8: 2rem,       // 32px
  10: 2.5rem,    // 40px
  12: 3rem,      // 48px
  16: 4rem,      // 64px
  20: 5rem,      // 80px
  24: 6rem,      // 96px
  32: 8rem,      // 128px
}
```

### Component Spacing Guidelines
```css
/* Container spacing */
.container-padding {
  padding: 1.5rem; /* 24px */
}

.section-spacing {
  margin-bottom: 3rem; /* 48px */
}

/* Card spacing */
.card {
  padding: 1.5rem; /* 24px */
  margin-bottom: 1rem; /* 16px */
}

.card-header {
  margin-bottom: 1rem; /* 16px */
}

.card-body {
  margin-bottom: 1.5rem; /* 24px */
}

/* Button spacing */
.button-group {
  gap: 0.75rem; /* 12px between buttons */
}

.button-with-icon {
  gap: 0.5rem; /* 8px between icon and text */
}

/* Form spacing */
.form-group {
  margin-bottom: 1.5rem; /* 24px */
}

.form-field {
  margin-bottom: 0.75rem; /* 12px */
}
```

## Component Specifications

### Button Components

#### Primary Button
```css
.btn-primary {
  @apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50;
}

.btn-primary:disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed;
}
```

#### Secondary Button
```css
.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50;
}
```

#### Success Button
```css
.btn-success {
  @apply bg-success-500 hover:bg-success-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-opacity-50;
}
```

#### Danger Button
```css
.btn-danger {
  @apply bg-error-500 hover:bg-error-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-opacity-50;
}
```

#### Button Sizes
```css
.btn-sm {
  @apply py-1.5 px-3 text-sm;
}

.btn-md {
  @apply py-2 px-4 text-base;
}

.btn-lg {
  @apply py-3 px-6 text-lg;
}
```

### Card Components

#### Base Card
```css
.card {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm;
}

.card-header {
  @apply border-b border-gray-200 pb-4 mb-4;
}

.card-body {
  @apply p-6;
}

.card-footer {
  @apply border-t border-gray-200 pt-4 mt-4;
}
```

#### Elevated Card
```css
.card-elevated {
  @apply bg-white rounded-lg shadow-lg border border-gray-200;
}
```

#### Interactive Card
```css
.card-interactive {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer;
}

.card-interactive:hover {
  @apply border-primary-300;
}
```

### Form Components

#### Input Field
```css
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200;
}

.input-field:disabled {
  @apply bg-gray-50 text-gray-500 cursor-not-allowed;
}

.input-field-error {
  @apply border-error-500 focus:ring-error-500 focus:border-error-500;
}

.input-field-success {
  @apply border-success-500 focus:ring-success-500 focus:border-success-500;
}
```

#### Label
```css
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-label-required::after {
  content: " *";
  @apply text-error-500;
}
```

#### Form Error
```css
.form-error {
  @apply text-sm text-error-600 mt-1;
}
```

#### Select Dropdown
```css
.select-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-colors duration-200;
}
```

### Badge Components

#### Status Badge
```css
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-success {
  @apply bg-success-100 text-success-800;
}

.badge-warning {
  @apply bg-warning-100 text-warning-800;
}

.badge-error {
  @apply bg-error-100 text-error-800;
}

.badge-primary {
  @apply bg-primary-100 text-primary-800;
}

.badge-gray {
  @apply bg-gray-100 text-gray-800;
}
```

### Navigation Components

#### Navigation Item
```css
.nav-item {
  @apply flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200;
}

.nav-item.active {
  @apply bg-primary-100 text-primary-700 border-r-2 border-primary-500;
}
```

#### Breadcrumb
```css
.breadcrumb {
  @apply flex items-center space-x-2 text-sm text-gray-500;
}

.breadcrumb-item {
  @apply hover:text-gray-700 transition-colors duration-200;
}

.breadcrumb-separator {
  @apply text-gray-400;
}
```

## Responsive Design Breakpoints

### Breakpoint System
```javascript
{
  sm: 640px,   // Small devices (mobile landscape)
  md: 768px,   // Medium devices (tablets)
  lg: 1024px,  // Large devices (desktop)
  xl: 1280px,  // Extra large devices
  '2xl': 1536px, // 2X large devices
}
```

### Responsive Classes Examples
```css
/* Mobile-first approach */
.container {
  @apply mx-auto px-4; /* Mobile: padding 16px */
  @apply sm:px-6;      /* Small+: padding 24px */
  @apply lg:px-8;      /* Large+: padding 32px */
}

/* Grid layouts */
.grid-responsive {
  @apply grid grid-cols-1 gap-4;           /* Mobile: 1 column */
  @apply sm:grid-cols-2 sm:gap-6;         /* Small+: 2 columns */
  @apply lg:grid-cols-3 lg:gap-8;         /* Large+: 3 columns */
}

/* Typography responsive */
.heading-responsive {
  @apply text-xl;    /* Mobile: 20px */
  @apply sm:text-2xl; /* Small+: 24px */
  @apply lg:text-3xl; /* Large+: 30px */
}

/* Spacing responsive */
.section-responsive {
  @apply py-8;       /* Mobile: 32px vertical */
  @apply lg:py-12;   /* Large+: 48px vertical */
}
```

## Animation & Interaction Specifications

### Transition System
```css
/* Base transition utility */
.transition-base {
  @apply transition-all duration-200 ease-in-out;
}

/* Fast transitions for hover states */
.transition-fast {
  @apply transition-colors duration-150 ease-in-out;
}

/* Slow transitions for page transitions */
.transition-slow {
  @apply transition-all duration-300 ease-in-out;
}
```

### Animation Classes
```css
/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

/* Slide up animation */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Pulse animation for loading states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spinning animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

### Hover Effects
```css
/* Card hover effect */
.card-hover {
  @apply transition-all duration-200 ease-in-out;
}

.card-hover:hover {
  @apply transform -translate-y-1 shadow-lg;
}

/* Button hover effects */
.btn-hover-scale {
  @apply transition-transform duration-200 ease-in-out;
}

.btn-hover-scale:hover {
  @apply transform scale-105;
}

/* Link hover effect */
.link-hover {
  @apply transition-colors duration-200 ease-in-out;
}

.link-hover:hover {
  @apply text-primary-600;
}
```

## Accessibility Guidelines

### Focus States
```css
/* Custom focus ring */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50;
}

/* High contrast focus for better visibility */
.focus-ring-high {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-opacity-75;
}
```

### Color Contrast Requirements
```css
/* Ensure minimum 4.5:1 contrast ratio for normal text */
/* Ensure minimum 3:1 contrast ratio for large text (18px+ or 14px+ bold) */

/* High contrast text classes */
.text-high-contrast {
  color: var(--gray-900); /* For light backgrounds */
}

.text-high-contrast-light {
  color: var(--gray-50); /* For dark backgrounds */
}
```

### Screen Reader Support
```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip to content link */
.skip-link {
  @apply absolute top-0 left-0 z-50 bg-primary-600 text-white px-4 py-2 rounded-br-lg transform -translate-y-full focus:translate-y-0 transition-transform duration-200;
}
```

### ARIA Support Guidelines
- Use `aria-label` for buttons without text
- Use `aria-describedby` to associate error messages with form fields
- Use `role` attributes for custom components
- Use `aria-expanded` for collapsible components
- Use `aria-live` for dynamic content updates

## Loading States

### Loading Spinner
```css
.loading-spinner {
  @apply inline-block w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin;
}

.loading-spinner-sm {
  @apply w-4 h-4;
}

.loading-spinner-lg {
  @apply w-8 h-8;
}
```

### Skeleton Loading
```css
.skeleton {
  @apply bg-gray-200 rounded animate-pulse;
}

.skeleton-text {
  @apply h-4 bg-gray-200 rounded animate-pulse;
}

.skeleton-title {
  @apply h-6 bg-gray-200 rounded animate-pulse;
}

.skeleton-avatar {
  @apply w-10 h-10 bg-gray-200 rounded-full animate-pulse;
}
```

## Utility Classes

### Common Layout Utilities
```css
/* Flexbox utilities */
.flex-center {
  @apply flex items-center justify-center;
}

.flex-between {
  @apply flex items-center justify-between;
}

.flex-col-center {
  @apply flex flex-col items-center justify-center;
}

/* Spacing utilities */
.m-auto { margin: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }

/* Text utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

/* Display utilities */
.hidden { display: none; }
.block { display: block; }
.inline-block { display: inline-block; }
.flex { display: flex; }

/* Position utilities */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Z-index utilities */
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-30 { z-index: 30; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }
```

This comprehensive UI/UX specification provides the foundation for implementing consistent, accessible, and visually appealing components throughout the gaming platform. The system ensures:

- **Consistency**: Standardized colors, typography, spacing, and components
- **Scalability**: Modular design system that can grow with the application
- **Accessibility**: Built-in support for screen readers, keyboard navigation, and color contrast
- **Responsiveness**: Mobile-first approach with clear breakpoints
- **Performance**: Optimized CSS with minimal redundancy
- **Maintainability**: Clear naming conventions and organized structure

Next, we'll implement these specifications in the actual React components with Tailwind CSS.