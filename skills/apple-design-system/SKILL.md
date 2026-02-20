# Apple-Level Design System Generator

**Skill ID:** `apple-design-system`  
**Type:** Design / Creative  
**Source:** Hamza Khalid (@Whizz_ai)  
**Version:** 1.0.0

---

## Overview

Generate complete design systems, brand guidelines, and 47+ marketing assets in 6 hours using Claude Opus 4.6.

**Based on:** https://x.com/Whizz_ai/status/2024489022819803333

---

## Installation (Claude Desktop)

### Method 1: Copy to Claude Projects

1. Open Claude Desktop
2. Create new Project: "Apple-Level Design"
3. Copy contents of `system-prompt.txt` into Project Instructions
4. Use prompts below in chat

### Method 2: MCP Server (Advanced)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apple-design": {
      "command": "node",
      "args": ["/path/to/skills/apple-design-system/mcp-server.js"]
    }
  }
}
```

---

## The 10 Prompts

### Prompt 1: Design System Foundation
```
Act as a senior Apple creative director with 20+ years experience.

Create a complete design system for [BRAND NAME] including:
- Core philosophy (3 guiding principles)
- Brand story (2-3 paragraphs)
- Design principles (5-7 rules)
- Visual identity strategy

The brand is: [DESCRIBE PRODUCT/SERVICE/AUDIENCE]

Output format: Structured markdown with clear hierarchy.
```

### Prompt 2: Color System
```
Based on the design system foundation above, create:

1. Primary color palette (6 colors)
   - Primary brand color + 5 variations
   - HEX codes + RGB + HSL values
   - Usage guidelines for each

2. Secondary/Accent colors (4 colors)
   - Supporting palette
   - Interaction states (hover, active, disabled)

3. Neutral scale (10 grays)
   - From pure white to pure black
   - Semantic naming (background, text, borders)

4. Semantic colors
   - Success, Warning, Error, Info
   - Light and dark variants

5. Color accessibility notes
   - WCAG contrast ratios
   - Color blindness considerations

Output as: CSS custom properties + usage guidelines
```

### Prompt 3: Typography System
```
Create a comprehensive typography system for [BRAND NAME]:

1. Font selection
   - Primary font (headings) + rationale
   - Secondary font (body) + rationale
   - Monospace font (code/data) + rationale
   - Web-safe fallbacks

2. Type scale (12 sizes)
   - Hero: 48-72px
   - Display: 36-48px
   - Headings H1-H6
   - Body large, Body, Body small, Caption
   - Font sizes in px, rem, and tailwind classes

3. Line heights
   - Tight (headings): 1.1-1.2
   - Normal (body): 1.5-1.6
   - Relaxed (long-form): 1.7-1.8

4. Font weights
   - Usage for each weight (100-900)

5. Letter spacing
   - Tight, normal, wide values

6. Typography patterns
   - Headline + subhead combinations
   - Body text with emphasis
   - Captions and metadata

Output: CSS variables + component examples
```

### Prompt 4: Spacing & Layout System
```
Design a spacing and layout system for [BRAND NAME]:

1. Base unit
   - Define 1 unit (typically 4px or 8px)
   - Rationale for choice

2. Spacing scale (12+ values)
   - 0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
   - Usage guidelines for each

3. Layout grid
   - Column system (12-column recommended)
   - Gutter widths
   - Margin/padding patterns
   - Breakpoints (mobile, tablet, desktop, wide)

4. Container widths
   - Max-width for content
   - Reading line length (60-75ch)
   - Centering approach

5. Common patterns
   - Card padding
   - Section spacing
   - Component internal spacing

Output: CSS custom properties + visual examples
```

### Prompt 5: Component Library (Part 1 - Foundation)
```
Design core UI components for [BRAND NAME]:

1. Buttons
   - Primary, Secondary, Tertiary, Ghost, Destructive
   - Sizes: Small, Medium, Large
   - States: Default, Hover, Active, Disabled, Loading
   - With/without icons
   - CSS + usage notes

2. Inputs
   - Text, Password, Email, Number, Search
   - States: Default, Focus, Error, Disabled
   - With/without labels, hints, errors
   - CSS + usage notes

3. Cards
   - Default, Interactive, Elevated
   - Header, body, footer patterns
   - Image handling
   - CSS + usage notes

4. Badges/Tags
   - Default, Success, Warning, Error, Info
   - Sizes, dismissible option
   - CSS + usage notes

Output: Component specifications + CSS
```

### Prompt 6: Component Library (Part 2 - Navigation)
```
Design navigation components for [BRAND NAME]:

1. Navigation bar
   - Desktop: Horizontal with dropdowns
   - Mobile: Hamburger menu
   - Logo placement
   - Active states
   - CSS + responsive behavior

2. Tabs
   - Horizontal and vertical variants
   - Active indicator
   - Overflow handling
   - CSS + interaction notes

3. Breadcrumbs
   - Separator styles
   - Current page handling
   - CSS + usage notes

4. Pagination
   - Numbered, Previous/Next
   - Active/disabled states
   - CSS + usage notes

5. Sidebar
   - Collapsible sections
   - Active item highlighting
   - Icons + text
   - CSS + responsive behavior

Output: Component specs + CSS + responsive notes
```

### Prompt 7: Component Library (Part 3 - Feedback)
```
Design feedback components for [BRAND NAME]:

1. Alerts/Notifications
   - Success, Warning, Error, Info
   - With/without icons
   - Dismissible option
   - CSS + animation notes

2. Modals/Dialogs
   - Overlay backdrop
   - Header, body, footer structure
   - Close button placement
   - Sizes: Small, Medium, Large
   - CSS + interaction notes

3. Toasts
   - Positioning (top, bottom, corners)
   - Auto-dismiss timing
   - Stacking multiple toasts
   - CSS + animation notes

4. Progress indicators
   - Linear progress bars
   - Circular/spinner loaders
   - Determinate vs indeterminate
   - CSS + usage notes

5. Empty states
   - Illustration placement
   - Message + CTA pattern
   - CSS + usage notes

Output: Component specs + CSS + interaction patterns
```

### Prompt 8: Brand Guidelines Document
```
Create a comprehensive brand guidelines document for [BRAND NAME]:

Structure:
1. Brand Overview (1 page)
   - Mission statement
   - Brand values (5-7)
   - Personality traits
   - Voice and tone

2. Visual Identity (3-4 pages)
   - Logo usage (correct/incorrect)
   - Color system summary
   - Typography guidelines
   - Photography style
   - Iconography style

3. Design System (3-4 pages)
   - Spacing and layout
   - Component overview
   - Responsive behavior
   - Animation principles

4. Writing Guidelines (2 pages)
   - Voice examples (Do/Don't)
   - Grammar preferences
   - Terminology glossary

5. Application Examples (3-4 pages)
   - Business cards
   - Letterhead
   - Social media templates
   - Email signatures

Output: Markdown formatted for PDF export
```

### Prompt 9: Marketing Asset Generation (Batch 1)
```
Generate 24 marketing assets for [BRAND NAME] using the design system:

Social Media (12 assets):
- Instagram posts: 3 square, 3 portrait
- Twitter/X headers: 3
- LinkedIn posts: 3

Digital Ads (6 assets):
- Google Ads: 3 sizes (300x250, 728x90, 160x600)
- Facebook Ads: 3 sizes

Email (6 templates):
- Welcome email
- Product announcement
- Newsletter header
- Promotional offer
- Event invitation
- Thank you email

For each, provide:
- Dimensions
- Content structure
- Color usage
- Typography hierarchy
- CTA placement
- Export specs

Output: Asset specifications + copy suggestions
```

### Prompt 10: Marketing Asset Generation (Batch 2)
```
Generate remaining 23+ marketing assets for [BRAND NAME]:

Website (5 pages):
- Homepage sections (hero, features, testimonials, CTA, footer)
- About page
- Product/Service page
- Pricing page
- Contact page

Print (6 assets):
- Business card (front/back)
- Letterhead
- Flyer/poster (3 sizes)
- Brochure (tri-fold)

Presentation (6 templates):
- Title slide
- Content slide (3 variants)
- Data/chart slide
- Quote slide
- Closing slide

Merchandise (6 items):
- T-shirt design
- Tote bag
- Sticker sheet
- Notebook cover
- Mug
- Laptop sticker

For each, provide:
- Full specifications
- Color profiles (RGB for digital, CMYK for print)
- Typography
- Image requirements
- Export formats

Output: Complete asset library specifications
```

---

## Workflow

**Recommended: 6-Hour Sprint**

| Hour | Activity |
|------|----------|
| 0:00-0:30 | Prompt 1: Foundation |
| 0:30-1:00 | Prompt 2: Colors |
| 1:00-1:30 | Prompt 3: Typography |
| 1:30-2:00 | Prompt 4: Spacing |
| 2:00-2:45 | Prompt 5: Components Part 1 |
| 2:45-3:30 | Prompt 6: Components Part 2 |
| 3:30-4:15 | Prompt 7: Components Part 3 |
| 4:15-5:00 | Prompt 8: Brand Guidelines |
| 5:00-5:30 | Prompt 9: Marketing Batch 1 |
| 5:30-6:00 | Prompt 10: Marketing Batch 2 |

---

## Tips for Best Results

1. **Fill in [BRACKETS]** before starting
2. **Iterate** — if output isn't perfect, refine and retry
3. **Save outputs** after each prompt
4. **Use Claude 3 Opus** for best design reasoning
5. **Review and refine** — AI generates drafts, you perfect them

---

## Export Options

After generating, export as:
- **Design Tokens** (JSON for developers)
- **Style Guide** (PDF for stakeholders)
- **Figma Variables** (CSV for designers)
- **CSS Variables** (for web implementation)

---

*Part of Ghost Skills Architecture*  
*Based on Hamza Khalid's viral X thread*
