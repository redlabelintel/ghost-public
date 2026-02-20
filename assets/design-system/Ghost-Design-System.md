# Ghost/Red Label Design System

**Complete design system generated via Apple Design System skill**
**Date:** February 20, 2026

---

## 1. Design System Foundation

### Core Philosophy (3 Guiding Principles)

1. **Precision Through Simplicity** — Complex AI operations made simple through clear interfaces and systematic approaches. Every feature must earn its place through utility, not novelty.

2. **Invisible Infrastructure** — The best AI system is one you don't notice. Ghost handles complexity so users can focus on outcomes, not operations.

3. **Transparent Power** — Full visibility into what agents do, why they do it, and what it costs. No black boxes, no hidden fees, no surprise bills.

### Brand Story

Ghost AI emerged from a simple frustration: AI tools that promised autonomy delivered only complexity. Founded by operators who'd burned through $290/day in API costs with nothing to show, Ghost was built on the principle that AI should work *for* you, not create more work.

Red Label Intelligence represents the premium tier of this philosophy — military-grade reliability for mission-critical operations. While others sell AI snake oil, we deliver systematic, measurable results. Every agent action is logged, every cost tracked, every outcome verified.

We don't do demos. We do deployments.

### Design Principles (7 Rules)

| # | Principle | Application |
|---|-----------|-------------|
| 1 | **White space is power** | Generous margins, clear hierarchy, no visual noise |
| 2 | **Data first, decoration never** | Charts over illustrations, metrics over metaphors |
| 3 | **Speed is a feature** | Fast loads, faster comprehension, fastest execution |
| 4 | **Dark mode is default** | Reduced eye strain during long operations |
| 5 | **Monospace for data** | IBM Plex Mono for all numbers, codes, technical content |
| 6 | **Brackets indicate action** | [BUTTON] styling for all interactive elements |
| 7 | **No color without purpose** | Grayscale base, color reserved for status states only |

---

## 2. Color System

### Primary Palette (6 colors)

| Name | HEX | RGB | HSL | Usage |
|------|-----|-----|-----|-------|
| **Ghost White** | `#FAFAFA` | 250, 250, 250 | 0°, 0%, 98% | Primary text on dark, key data |
| **Steel Gray** | `#6B7280` | 107, 114, 128 | 220°, 9%, 46% | Secondary text, muted info |
| **Deep Void** | `#0A0A0A` | 10, 10, 10 | 0°, 0%, 4% | Primary background |
| **Charcoal** | `#1F1F1F` | 31, 31, 31 | 0°, 0%, 12% | Card backgrounds, containers |
| **Border Gray** | `#2D2D2D` | 45, 45, 45 | 0°, 0%, 18% | Borders, dividers, subtle separation |
| **Red Label** | `#DC2626` | 220, 38, 38 | 0°, 83%, 51% | Brand accent, alerts, critical status |

### Secondary/Accent Colors (4 colors)

| Name | HEX | Usage |
|------|-----|-------|
| **Success Green** | `#22C55E` | Success states, positive metrics, $0 cost |
| **Warning Amber** | `#F59E0B` | Warnings, attention needed, medium priority |
| **Info Blue** | `#3B82F6` | Information, links, active states |
| **Purple Accent** | `#8B5CF6` | Premium features, Red Label tier, special status |

### Neutral Scale (10 grays)

| Step | Name | HEX | Usage |
|------|------|-----|-------|
| 0 | **Pure White** | `#FFFFFF` | Highlights, max contrast |
| 50 | **Ghost White** | `#FAFAFA` | Primary text |
| 100 | **Light Gray** | `#E5E5E5` | Hover states, secondary text light |
| 200 | **Silver** | `#D4D4D4` | Disabled text light |
| 300 | **Medium Gray** | `#A3A3A3` | Tertiary text |
| 400 | **Steel Gray** | `#6B7280` | Secondary text, icons |
| 500 | **Slate** | `#525252` | Subtle text on light |
| 600 | **Dark Gray** | `#404040` | Light mode text |
| 700 | **Charcoal** | `#1F1F1F` | Card backgrounds |
| 800 | **Near Black** | `#171717` | Elevated surfaces |
| 900 | **Deep Void** | `#0A0A0A` | Primary background |
| 950 | **Pure Black** | `#000000` | Maximum depth, black holes |

### CSS Custom Properties

```css
:root {
  /* Primary */
  --color-ghost-white: #FAFAFA;
  --color-steel-gray: #6B7280;
  --color-deep-void: #0A0A0A;
  --color-charcoal: #1F1F1F;
  --color-border-gray: #2D2D2D;
  --color-red-label: #DC2626;
  
  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  --color-premium: #8B5CF6;
}
```

---

## 3. Typography System

### Font Selection

| Role | Font | Rationale |
|------|------|-----------|
| **Primary (Headings)** | **IBM Plex Sans** | IBM heritage, technical precision, open source |
| **Secondary (Body)** | **Inter** | Excellent readability, designed for screens, modern |
| **Monospace (Data/Code)** | **IBM Plex Mono** | Technical authority, aligns with IBM Plex Sans, perfect for metrics |
| **Fallback Stack** | system-ui, -apple-system, sans-serif | Performance, native feel |

### Type Scale (12 Sizes)

| Name | Size | Line Height | Weight | Usage | Tailwind Class |
|------|------|-------------|--------|-------|----------------|
| **Hero** | 72px / 4.5rem | 1.1 | 700 | Landing page headlines | `text-7xl` |
| **Display** | 48px / 3rem | 1.15 | 700 | Page titles, major sections | `text-5xl` |
| **H1** | 36px / 2.25rem | 1.2 | 600 | Primary headings | `text-4xl` |
| **H2** | 30px / 1.875rem | 1.25 | 600 | Section headings | `text-3xl` |
| **H3** | 24px / 1.5rem | 1.3 | 600 | Subsection headings | `text-2xl` |
| **H4** | 20px / 1.25rem | 1.4 | 500 | Card titles | `text-xl` |
| **H5** | 18px / 1.125rem | 1.4 | 500 | Component labels | `text-lg` |
| **H6** | 16px / 1rem | 1.5 | 500 | Minor headings | `text-base` |
| **Body Large** | 18px / 1.125rem | 1.6 | 400 | Lead paragraphs | `text-lg` |
| **Body** | 16px / 1rem | 1.6 | 400 | Primary text | `text-base` |
| **Body Small** | 14px / 0.875rem | 1.5 | 400 | Secondary text | `text-sm` |
| **Caption** | 12px / 0.75rem | 1.5 | 400 | Metadata, timestamps | `text-xs` |

### CSS Custom Properties

```css
:root {
  /* Font Families */
  --font-sans: 'IBM Plex Sans', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SF Mono', Monaco, monospace;
  
  /* Type Scale */
  --text-hero: 4.5rem;      /* 72px */
  --text-display: 3rem;     /* 48px */
  --text-h1: 2.25rem;       /* 36px */
  --text-h2: 1.875rem;      /* 30px */
  --text-h3: 1.5rem;        /* 24px */
  --text-h4: 1.25rem;       /* 20px */
  --text-h5: 1.125rem;      /* 18px */
  --text-h6: 1rem;          /* 16px */
  --text-body-lg: 1.125rem; /* 18px */
  --text-body: 1rem;        /* 16px */
  --text-body-sm: 0.875rem; /* 14px */
  --text-caption: 0.75rem;  /* 12px */
  
  /* Line Heights */
  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

---

## 4. Spacing & Layout System

### Base Unit

**4px** — The atomic unit of spacing

### Spacing Scale (20+ values)

| Token | Value | px | rem | Usage |
|-------|-------|-----|-----|-------|
| `space-0` | 0 | 0px | 0 | No space |
| `space-px` | 1px | 1px | 0.0625 | Hairline borders |
| `space-0.5` | 0.5×base | 2px | 0.125 | Tight gaps |
| `space-1` | 1×base | 4px | 0.25 | Tight padding |
| `space-1.5` | 1.5×base | 6px | 0.375 | Compact spacing |
| `space-2` | 2×base | 8px | 0.5 | Default gap |
| `space-2.5` | 2.5×base | 10px | 0.625 | Button padding |
| `space-3` | 3×base | 12px | 0.75 | Card padding |
| `space-4` | 4×base | 16px | 1 | Section padding |
| `space-5` | 5×base | 20px | 1.25 | Large gaps |
| `space-6` | 6×base | 24px | 1.5 | Component separation |
| `space-8` | 8×base | 32px | 2 | Section separation |
| `space-10` | 10×base | 40px | 2.5 | Page padding |
| `space-12` | 12×base | 48px | 3 | Major separation |
| `space-16` | 16×base | 64px | 4 | Major divisions |
| `space-20` | 20×base | 80px | 5 | Page sections |
| `space-24` | 24×base | 96px | 6 | Major page sections |

### Breakpoints

| Name | Width | Target |
|------|-------|--------|
| **sm** | 640px | Small tablets |
| **md** | 768px | Tablets |
| **lg** | 1024px | Laptops |
| **xl** | 1280px | Desktops |
| **2xl** | 1536px | Large screens |

### CSS Custom Properties

```css
:root {
  /* Base */
  --space-base: 4px;
  
  /* Spacing Scale */
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 2px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  
  /* Layout */
  --container-max: 1280px;
  --content-max: 720px;
  --gutter: 24px;
}
```

---

## 5. Components Part 1 — Foundation

### Buttons

#### Variants

| Variant | Usage | Style |
|---------|-------|-------|
| **Primary** | Main CTA, important actions | Red Label bg, white text |
| **Secondary** | Alternative actions | Charcoal bg, white text, border |
| **Tertiary** | Minor actions | Transparent, white text |
| **Ghost** | Subtle actions | Transparent, muted text |
| **Destructive** | Delete, remove, danger | Dark red bg, white text |

#### Sizes

| Size | Padding | Font | Height |
|------|---------|------|--------|
| **Small** | 8px 12px | 14px | 32px |
| **Medium** | 10px 16px | 16px | 40px |
| **Large** | 12px 24px | 18px | 48px |

#### States

| State | Style |
|-------|-------|
| **Default** | Standard appearance |
| **Hover** | 10% lighter background, cursor pointer |
| **Active** | 10% darker background, inset shadow |
| **Disabled** | 50% opacity, no pointer events |
| **Loading** | Spinner icon, disabled interactions |
| **Focus** | 2px outline (Info Blue), offset 2px |

#### Button CSS
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: 4px;
  font-weight: 500;
  transition: all 150ms ease;
}

.btn-primary {
  background: var(--color-red-label);
  color: var(--color-white);
}

.btn-primary:hover {
  background: #EF4444;
}
```

### Inputs

#### Types
- **Text**: Single-line text entry
- **Password**: Masked text entry
- **Email**: Email validation
- **Number**: Numeric entry with steppers
- **Search**: With search icon, clear button

#### Sizes
| Size | Height | Padding | Font |
|------|--------|---------|------|
| Small | 32px | 8px 12px | 14px |
| Medium | 40px | 10px 16px | 16px |
| Large | 48px | 12px 16px | 16px |

#### States
| State | Style |
|-------|-------|
| **Default** | Border gray, transparent bg |
| **Focus** | Info Blue border, subtle glow |
| **Error** | Red Label border, error message below |
| **Disabled** | 50% opacity, gray bg |

#### Input CSS
```css
.input {
  height: 40px;
  padding: var(--space-2-5) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border-gray);
  border-radius: 4px;
  color: var(--color-ghost-white);
}

.input:focus {
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Cards

#### Variants
| Variant | Usage | Shadow |
|---------|-------|--------|
| **Default** | Standard content containers | None |
| **Elevated** | Important content, modals | Subtle shadow |
| **Interactive** | Clickable cards | Hover lift effect |
| **Outlined** | Subtle separation | Border only |

#### Structure
- **Header**: Title (H4), Subtitle (Caption), Actions (top right)
- **Body**: Content area, Padding 16px-24px
- **Footer**: Actions, metadata

#### Card CSS
```css
.card {
  background: var(--color-charcoal);
  border: 1px solid var(--color-border-gray);
  border-radius: 8px;
  padding: var(--space-5);
}

.card-elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}
```

### Badges/Tags

#### Variants
| Variant | Color | Usage |
|---------|-------|-------|
| **Default** | Steel Gray | Neutral status |
| **Success** | Green | Active, healthy, complete |
| **Warning** | Amber | Attention needed, pending |
| **Error** | Red Label | Failed, critical, alert |
| **Info** | Blue | Informational, neutral |

#### Badge CSS
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: 9999px;
  font-size: var(--text-body-sm);
  font-weight: 500;
}

.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}
```

---

## 6. Components Part 2 — Navigation

### Navigation Bar

#### Desktop
- Height: 64px
- Background: Deep Void with subtle border-bottom
- Logo: Left-aligned, 32px height
- Links: Center or right, 16px gap
- Active state: Red Label underline or bg

#### Mobile
- Hamburger menu icon (24px)
- Full-screen overlay menu
- Slide-in from right
- Dark background with blur backdrop

#### Nav CSS
```css
.navbar {
  height: 64px;
  background: var(--color-deep-void);
  border-bottom: 1px solid var(--color-border-gray);
  padding: 0 var(--space-6);
}

.nav-link {
  color: var(--color-steel-gray);
  font-weight: 500;
  padding: var(--space-2) var(--space-3);
}

.nav-link-active {
  color: var(--color-ghost-white);
  background: var(--color-charcoal);
  border-radius: 4px;
}
```

### Tabs

#### Variants
- **Horizontal**: Default, text with underline indicator
- **Vertical**: Side navigation, left border indicator
- **Pills**: Rounded button-style tabs

#### States
| State | Style |
|-------|-------|
| **Default** | Muted text, no indicator |
| **Hover** | Full opacity text |
| **Active** | White text, Red Label underline |
| **Disabled** | 50% opacity |

#### Tab CSS
```css
.tab {
  padding: var(--space-3) var(--space-4);
  color: var(--color-steel-gray);
  border-bottom: 2px solid transparent;
}

.tab-active {
  color: var(--color-ghost-white);
  border-bottom-color: var(--color-red-label);
}
```

### Breadcrumbs

#### Structure
```
Home > Category > Page > Current
```

#### Style
- Separator: "/" or ">" in Steel Gray
- Links: Steel Gray, hover to white
- Current: Ghost White, no link
- Font: 14px, normal weight

#### Breadcrumb CSS
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-body-sm);
}

.breadcrumb-separator {
  color: var(--color-steel-gray);
}

.breadcrumb-current {
  color: var(--color-ghost-white);
}
```

### Pagination

#### Types
- **Numbered**: 1 2 3 ... 10 page numbers
- **Previous/Next**: Arrow buttons with labels
- **Combined**: Arrows + limited page numbers

#### States
| State | Style |
|-------|-------|
| **Default** | Border, transparent bg |
| **Active** | Red Label bg, white text |
| **Hover** | Charcoal bg |
| **Disabled** | 50% opacity, no border |

#### Pagination CSS
```css
.pagination-btn {
  min-width: 40px;
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-gray);
  border-radius: 4px;
  color: var(--color-ghost-white);
}

.pagination-btn-active {
  background: var(--color-red-label);
  border-color: var(--color-red-label);
}
```

### Sidebar

#### Structure
- Width: 256px (16rem)
- Background: Charcoal
- Padding: 16px
- Sections with 24px gap

#### Items
- Icon (20px) + Text
- Gap: 12px
- Active: Left border (2px Red Label), lighter bg
- Hover: Slightly lighter bg

#### Sidebar CSS
```css
.sidebar {
  width: 256px;
  background: var(--color-charcoal);
  padding: var(--space-4);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: 4px;
  color: var(--color-steel-gray);
}

.sidebar-item-active {
  background: rgba(220, 38, 38, 0.1);
  border-left: 2px solid var(--color-red-label);
  color: var(--color-ghost-white);
}
```

---

*Design System in progress — Prompts 1-6 complete*
