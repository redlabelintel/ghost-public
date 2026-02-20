

---

## 7. Components Part 3 — Feedback

### Alerts/Notifications

#### Variants
| Variant | Color | Icon | Usage |
|---------|-------|------|-------|
| **Success** | Green | Checkmark | Operation completed, system healthy |
| **Warning** | Amber | Triangle | Attention needed, non-critical |
| **Error** | Red Label | X | Operation failed, critical issue |
| **Info** | Blue | Info circle | Informational, neutral |

#### Structure
- Icon (20px) + Message + Optional Close button
- Padding: 16px
- Border radius: 8px
- Border left: 4px solid (variant color)

#### Alert CSS
```css
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-charcoal);
  border-left: 4px solid;
  border-radius: 8px;
}

.alert-success {
  border-left-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}
```

### Modals/Dialogs

#### Sizes
| Size | Width | Usage |
|------|-------|-------|
| Small | 400px | Confirmations, simple forms |
| Medium | 560px | Standard dialogs |
| Large | 720px | Complex forms, detail views |

#### Structure
- **Overlay**: 50% black backdrop, blur(4px)
- **Header**: Title (H3), Close button (X)
- **Body**: Content area, max-height 60vh, scrollable
- **Footer**: Action buttons (right-aligned)

#### Modal CSS
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 560px;
  max-height: 80vh;
  background: var(--color-deep-void);
  border: 1px solid var(--color-border-gray);
  border-radius: 12px;
}

.modal-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-gray);
}

.modal-body {
  padding: var(--space-5);
  overflow-y: auto;
  max-height: 60vh;
}

.modal-footer {
  padding: var(--space-5);
  border-top: 1px solid var(--color-border-gray);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
```

### Toasts

#### Positioning
- Top-right (default)
- Top-center
- Bottom-right
- Bottom-center

#### Behavior
- Auto-dismiss: 5 seconds
- Progress bar showing remaining time
- Pause on hover
- Stacking: Max 5 visible, older ones hidden

#### Toast CSS
```css
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-charcoal);
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  animation: slideIn 300ms ease;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--color-red-label);
  animation: progress 5s linear;
}
```

### Progress Indicators

#### Linear Progress Bar
- Height: 4px (sm), 8px (md), 12px (lg)
- Background: Border Gray
- Fill: Red Label (primary), Blue (info)
- Border radius: 9999px

#### Circular/Spinner
- Sizes: 16px, 24px, 32px, 48px
- Stroke: 2px
- Animation: 360° rotation, 1s linear infinite

#### Progress CSS
```css
.progress-bar {
  height: 8px;
  background: var(--color-border-gray);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-red-label);
  transition: width 300ms ease;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-gray);
  border-top-color: var(--color-red-label);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### Empty States

#### Structure
- Illustration/Icon (64px)
- Title (H4): "No sessions found"
- Description: Context and next steps
- CTA Button: Primary action

#### Empty State CSS
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12);
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  color: var(--color-steel-gray);
  margin-bottom: var(--space-4);
}

.empty-state-title {
  color: var(--color-ghost-white);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  color: var(--color-steel-gray);
  max-width: 400px;
  margin-bottom: var(--space-6);
}
```

---

## 8. Brand Guidelines Document

### Document Structure

#### 1. Brand Overview (1 page)

**Mission Statement**
> Ghost AI makes autonomous AI systems accessible to technical founders through invisible infrastructure and transparent operations.

**Brand Values (5)**
1. **Transparency**: No black boxes, full visibility
2. **Precision**: Every feature earns its place
3. **Reliability**: Military-grade uptime
4. **Efficiency**: Zero waste, maximum output
5. **Autonomy**: AI that works for you

**Personality Traits**
- Direct, not verbose
- Technical, not elitist
- Serious, not boring
- Confident, not arrogant

#### 2. Visual Identity (3-4 pages)

**Logo Usage**
- Clear space: 2x logo height on all sides
- Minimum size: 32px height
- Never: Stretch, rotate, change colors, add effects
- Always: Use provided files, maintain proportions

**Color System Summary**
- Primary: Ghost White, Red Label, Deep Void
- Secondary: Success Green, Warning Amber, Info Blue
- Neutrals: 10-step gray scale
- Usage: 80% neutral, 15% primary, 5% accent

**Typography Guidelines**
- Headings: IBM Plex Sans (600 weight)
- Body: Inter (400 weight)
- Data: IBM Plex Mono (400/500 weight)
- Never: More than 3 sizes on one screen

**Photography Style**
- Dark, moody, high contrast
- Technical subjects: servers, code, interfaces
- Human element: hands typing, focused faces
- No stock photos, no generic tech imagery

**Iconography Style**
- Line icons, 2px stroke
- 24px default size
- Outline style, no fills
- Rounded corners (2px)

#### 3. Design System (3-4 pages)

**Spacing and Layout**
- Base unit: 4px
- Component gap: 16px
- Section gap: 32px-64px
- Max content width: 720px reading, 1280px dashboard

**Component Overview**
- See Components sections (Prompts 5-7)
- All components in Figma library
- Code components in Storybook

**Responsive Behavior**
- Mobile-first design
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch targets: Min 44px
- Font scaling: 1rem = 16px base

**Animation Principles**
- Duration: 150ms (fast), 300ms (normal), 500ms (slow)
- Easing: ease for UI, ease-out for entrances
- Purpose: Guide attention, show relationships
- Avoid: Decorative animations, long durations

#### 4. Writing Guidelines (2 pages)

**Voice Examples (Do/Don't)**

| Do | Don't |
|----|-------|
| "Session Guardian terminated 3 runaway processes" | "We noticed some issues and took care of them" |
| "$0/day sustained" | "You're saving a lot of money!" |
| "Deploy in 10 seconds" | "Deploy faster than ever before" |
| "99.9% uptime guarantee" | "We never go down" |

**Grammar Preferences**
- Active voice
- Short sentences (max 20 words)
- No exclamation points
- Numbers as digits (0, 1, 2) not words

**Terminology Glossary**

| Term | Definition | Usage |
|------|------------|-------|
| **Ghost** | The AI agent system | Always capitalized |
| **Session** | A single conversation context | Not "chat" or "thread" |
| **Skill** | A modular capability | Not "tool" or "function" |
| **Guardian** | Cost protection system | Full name: Session Guardian |
| **Red Label** | Premium tier | Two words, both capitalized |

#### 5. Application Examples (3-4 pages)

**Business Cards**
- Front: Logo + Name + Title
- Back: URL + Tagline
- Stock: 16pt matte black

**Letterhead**
- Top: Logo (left), Contact (right)
- Margin: 1 inch all sides
- Body: Inter 11pt, 1.5 line height

**Social Media Templates**
- Twitter/X: 1600x900px
- LinkedIn: 1200x627px
- Instagram: 1080x1080px

**Email Signatures**
- Name + Title
- Ghost logo (32px)
- URL only, no social icons

---

## 9. Marketing Assets Batch 1 (24 assets)

### Social Media (12 assets)

#### Instagram Posts
- 3 square (1080x1080px)
  - "$0/day" cost achievement
  - "865 sessions" monitoring capability
  - "Deploy in 10 seconds" speed claim
- 3 portrait (1080x1350px)
  - "Before/After" cost comparison
  - "How it works" process diagram
  - "Customer quote" testimonial

#### Twitter/X Headers (3)
- 1500x500px
  - Brand header with tagline
  - Product screenshot montage
  - Abstract data visualization

#### LinkedIn Posts (3)
- 1200x627px
  - B2B focused messaging
  - ROI calculator preview
  - Enterprise security features

**Common Elements:**
- Deep Void background
- Red Label accent
- IBM Plex Mono for metrics
- [BRACKET] button style CTAs

### Digital Ads (6 assets)

#### Google Ads (3 sizes)
- 300x250px (Medium Rectangle)
- 728x90px (Leaderboard)
- 160x600px (Wide Skyscraper)

**Message:** "AI agents that cost $0/day"
**CTA:** [Start Free]

#### Facebook Ads (3 sizes)
- 1080x1080px (Feed)
- 1200x628px (Feed alternate)
- 1080x1920px (Stories)

### Email (6 templates)

#### 1. Welcome Email
- Subject: "Your Ghost is ready"
- Body: Setup instructions, first steps
- CTA: [Open Dashboard]

#### 2. Product Announcement
- Subject: "New: Session Guardian"
- Body: Feature explanation, benefits
- CTA: [Learn More]

#### 3. Newsletter Header
- Monthly digest
- Ghost branding
- Article previews

#### 4. Promotional Offer
- Subject: "Red Label: 50% off first month"
- Body: Premium features list
- CTA: [Upgrade Now]

#### 5. Event Invitation
- Subject: "Join us: AI Infrastructure Webinar"
- Body: Date, time, speaker, agenda
- CTA: [Register]

#### 6. Thank You Email
- Post-purchase
- Next steps
- Support contact

---

## 10. Marketing Assets Batch 2 (23+ assets)

### Website Pages (5)

#### 1. Homepage Sections
- **Hero**: Headline + Subhead + [Get Started] + Product screenshot
- **Features**: 3-column grid, icons + text
- **Social Proof**: Logos + testimonials
- **Pricing**: Plans comparison table
- **CTA**: Final conversion push

#### 2. About Page
- Company story
- Team section
- Values
- Timeline/milestones

#### 3. Product/Service Page
- Feature deep-dive
- Technical specs
- Use cases
- Integration logos

#### 4. Pricing Page
- 3-tier comparison
- Feature checklist
- FAQ accordion
- Enterprise CTA

#### 5. Contact Page
- Form (Name, Email, Company, Message)
- Support email
- Documentation link
- Social links

### Print Materials (6)

#### 1. Business Card (Front/Back)
- Front: Logo, Name, Title
- Back: ghost.ai, tagline
- Size: 3.5" x 2"

#### 2. Letterhead
- Header: Logo + Address
- Footer: URL + Contact
- Body: Standard margins

#### 3. Flyer/Poster (3 sizes)
- A4 (8.27" x 11.69")
- Letter (8.5" x 11")
- Tabloid (11" x 17")
- Content: Key benefits + QR code

#### 4. Brochure (Tri-fold)
- Front: Cover + Hook
- Inside: Features + Benefits + Proof
- Back: Pricing + Contact

### Presentation (6 templates)

#### 1. Title Slide
- Logo centered
- Presentation title
- Date, presenter

#### 2. Content Slide (3 variants)
- Single column (text focus)
- Two column (text + image)
- Three column (features)

#### 3. Data/Chart Slide
- Chart placeholder
- Key metric callout
- Context text

#### 4. Quote Slide
- Large quote text
- Attribution
- Ghost branding

#### 5. Closing Slide
- Thank you
- Contact info
- URL + QR code

### Merchandise (6 items)

#### 1. T-shirt Design
- Front: Ghost wordmark
- Back: Red Label mark
- Color: Black on Deep Void

#### 2. Tote Bag
- Front: Logo + Tagline
- Color: Natural canvas

#### 3. Sticker Sheet
- Logo (multiple sizes)
- Icon set
- Wordmark variations

#### 4. Notebook Cover
- Embossed logo
- Dot grid pages
- Bookmark ribbon

#### 5. Mug
- Ghost logo (one side)
- "$0/day" (other side)
- Black ceramic

#### 6. Laptop Sticker
- Die-cut logo
- 3" width
- Weatherproof vinyl

---

## Implementation Checklist

### Design Tokens
- [ ] Export colors to JSON
- [ ] Export typography to JSON
- [ ] Export spacing to JSON

### Development
- [ ] Create CSS custom properties file
- [ ] Build Tailwind config
- [ ] Component library (React/Vue/Svelte)

### Design
- [ ] Figma library with all components
- [ ] Figma variables for tokens
- [ ] Auto-layout components

### Documentation
- [ ] Storybook for components
- [ ] Usage examples
- [ ] Migration guide

### Marketing
- [ ] Export all social assets
- [ ] Prepare email templates
- [ ] Print-ready PDFs

---

## CSS Framework File

```css
/* Ghost Design System v1.0 */
/* Complete CSS custom properties */

:root {
  /* Colors */
  --color-ghost-white: #FAFAFA;
  --color-steel-gray: #6B7280;
  --color-deep-void: #0A0A0A;
  --color-charcoal: #1F1F1F;
  --color-border-gray: #2D2D2D;
  --color-red-label: #DC2626;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  --color-premium: #8B5CF6;
  
  /* Typography */
  --font-sans: 'IBM Plex Sans', 'Inter', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
  
  /* Spacing */
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
}
```

---

*Ghost Design System v1.0 — Complete*
*Generated via Apple Design System skill*
*10 prompts, 6 hours, 47+ assets*
