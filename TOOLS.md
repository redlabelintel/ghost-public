# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

### Skills

- **visual-qa** → Design review skill (from Dylan Feltus). Location: `~/ghost-repo/skills/visual-qa/SKILL.md`
  - Use for: Screenshot review, design QA, implementation vs mockup comparison
  - 7 review categories: Layout/Spacing, Typography, Color/Contrast, Visual Hierarchy, Component Quality, Polish, Responsive
  
- **harness-audit** → Trace analysis skill for self-improvement
  - Use for: Session failure diagnosis, harness optimization, pattern detection
  - Parallel analysis: Tool Call, Context Window, Memory Retrieval, Session Flow
  - Output: Specific harness fixes with evidence

---

Add whatever helps you do your job. This is your cheat sheet.
