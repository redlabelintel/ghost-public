# Ghost Skills Registry

**Modular capabilities for Ghost AI**

---

## Active Skills

| Skill ID | Name | Status | Description |
|----------|------|--------|-------------|
| `visual-qa` | Visual QA | ✅ Active | AI-powered UI screenshot review |

---

## Skill Structure

Each skill follows this structure:

```
skills/
├── {skill-id}/
│   ├── SKILL.md      # Documentation
│   ├── {skill-id}.js # Implementation
│   └── examples/     # Usage examples
```

---

## Adding New Skills

1. Create directory: `skills/{skill-id}/`
2. Add `SKILL.md` with documentation
3. Add implementation file
4. Update this registry
5. Test integration
6. Commit to repo

---

## Usage

```javascript
// Load skill
const { visualQA } = require('./skills/visual-qa/visual-qa');

// Use skill
const result = await visualQA(options);
```

---

## Active Skills

| Skill ID | Name | Status | Description |
|----------|------|--------|-------------|
| `visual-qa` | Visual QA | ✅ Active | AI-powered UI screenshot review |
| `apple-design-system` | Apple Design System | ✅ Active | 10 prompts for complete design systems |

## Skill Roadmap

| Priority | Skill | Source |
|----------|-------|--------|
| 🔴 High | Skill Architecture Framework | Boring Marketer bookmark |
| 🟡 Medium | Content Generation | Various |
| 🟡 Medium | Data Pipeline | Various |
| 🟢 Low | Marketing Automation | J.B. bookmark |

---

*Skills Architecture v1.0*
