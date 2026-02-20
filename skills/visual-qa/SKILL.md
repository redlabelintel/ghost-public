# Visual QA Skill

**Skill ID:** `visual-qa`  
**Type:** Image Analysis / UI Review  
**Author:** Dylan Feltus (adapted for Ghost)  
**Version:** 1.0.0

---

## Overview

AI-powered visual quality assurance for UI screenshots. Reviews designs like a human designer would — checking spacing, alignment, color, typography, responsiveness, and accessibility.

**Use Cases:**
- Automated UI regression testing
- Design system compliance checking
- Mockup vs. implementation comparison
- Accessibility auditing

---

## Installation

```bash
# Dependencies already in Ghost workspace
# Requires: Node.js 18+, Sharp (image processing)

npm install sharp
```

---

## Usage

### Basic Review

```javascript
const { visualQA } = require('./skills/visual-qa');

const result = await visualQA({
  screenshot: 'path/to/ui-screenshot.png',
  mockup: 'path/to/design-mockup.png', // optional
  categories: ['spacing', 'alignment', 'color', 'typography']
});

console.log(result.violations);
console.log(result.score);
```

### CLI Usage

```bash
node skills/visual-qa/visual-qa.js --screenshot dashboard.png --mockup design.png
```

---

## Review Categories

| Category | Checks |
|----------|--------|
| **spacing** | Margins, padding, whitespace consistency |
| **alignment** | Grid adherence, element positioning |
| **color** | Brand colors, contrast ratios, consistency |
| **typography** | Font sizes, weights, line heights |
| **responsiveness** | Breakpoint behavior, fluid layouts |
| **accessibility** | WCAG compliance, color contrast |
| **comparison** | Pixel-perfect mockup matching |

---

## Output Format

```json
{
  "score": 87,
  "grade": "B+",
  "violations": [
    {
      "category": "spacing",
      "severity": "medium",
      "element": "button-primary",
      "issue": "Inconsistent padding (16px vs 20px)",
      "recommendation": "Standardize to 16px"
    }
  ],
  "summary": "3 spacing issues, 1 color contrast warning"
}
```

---

## Integration

### With Ghost Workflow

1. Screenshot UI component
2. Run visual QA
3. Generate report
4. Commit fixes

### With CI/CD

```yaml
- name: Visual QA
  run: node skills/visual-qa/visual-qa.js --screenshot build/
```

---

## Files

- `visual-qa.js` — Main implementation
- `reviewers/` — Category-specific reviewers
- `utils/` — Image processing helpers

---

*Part of Ghost Skills Architecture*
