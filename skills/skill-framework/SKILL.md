---
name: skill-framework
description: Systematic framework for designing, organizing, and composing agent skills. Use when creating new skills, refactoring agent capabilities, or establishing skill standards. Ensures skills are composable, discoverable, and maintainable.
---

# Skill Architecture Framework

Systematic framework for designing, organizing, and composing agent skills.

## Core Philosophy

**Skills > Agents.** Agents are orchestrators. Skills are capabilities.

**Composition over Monolith.** Small, focused skills that call each other beat large, complex agents.

**Standards enable Scale.** Consistent interfaces, documentation, and patterns make skills reusable.

---

## Skill Directory Structure

```
skills/
├── SKILL.md                    # This framework
├── skill-framework/
│   └── SKILL.md               # Skill design patterns
├── {skill-name}/
│   ├── SKILL.md               # Required: Usage, examples, interface
│   ├── SKILL_EVAL.md          # Optional: Component tests
│   ├── examples/              # Optional: Example inputs/outputs
│   └── assets/                # Optional: Images, templates
```

## Skill Interface Standard

Every skill must define:

```yaml
interface:
  name: string                 # Skill identifier
  description: string          # What it does
  triggers:                    # How it's invoked
    - keyword patterns
    - intent detection
  inputs:                      # Expected parameters
    - name: param1
      type: string|number|boolean|object
      required: true|false
      description: "What this param does"
  outputs:                     # What it returns
    format: string|object|html|file
    structure: "Description of output shape"
  dependencies:                # Other skills/tools it uses
    - skill-name
    - tool-name
  errors:                      # Known failure modes
    - condition: "When this happens"
      handling: "What to do"
```

## Skill Categories

### Analysis Skills
- **Purpose:** Process inputs, extract insights
- **Examples:** harness-audit, bookmark-analysis, x-content-analysis
- **Pattern:** Input → Processing → Structured Output

### Generation Skills  
- **Purpose:** Create artifacts from specifications
- **Examples:** visual-explainer, ghost-design-system
- **Pattern:** Specification → Generation → Deliverable

### Integration Skills
- **Purpose:** Connect external services
- **Examples:** raindrop-sync, airtable-sync, github-automation
- **Pattern:** Trigger → API Call → Data Transform → Store

### Monitoring Skills
- **Purpose:** Watch systems, alert on conditions
- **Examples:** session-guardian, health-check, pattern-detector
- **Pattern:** Schedule → Check → Alert/Log

## Skill Composition Patterns

### Chain Pattern
```
Skill A → Skill B → Skill C
```
Sequential processing. Output of A becomes input of B.

**Example:** Bookmark Analysis → Skill Extraction → Implementation

### Fan-Out Pattern
```
     ┌→ Skill A
Input → Skill B
     └→ Skill C
```
Parallel analysis. Multiple skills process same input.

**Example:** Harness Audit (4 parallel analyzers)

### Fan-In Pattern
```
Skill A ─┐
Skill B ─→ Aggregator → Output
Skill C ─┘
```
Multiple outputs combined into single result.

**Example:** Morning Standup (agents report → summary)

### Recursive Pattern
```
Skill A → (if complex) → Skill A with sub-task
```
Self-calling for complex problems.

**Example:** Task decomposition → sub-task execution

## Skill Design Checklist

Before creating a new skill, verify:

- [ ] **Doesn't duplicate existing skill?** Check `/skills/` directory
- [ ] **Single responsibility?** Does one thing well
- [ ] **Composable?** Can other skills call it
- [ ] **Documented interface?** Clear inputs/outputs
- [ ] **Testable?** SKILL_EVAL.md with test cases
- [ ] **Has examples?** Real usage examples
- [ ] **Error handling?** Known failure modes documented
- [ ] **Cost-conscious?** Uses local model when possible

## Skill Migration: Agents → Skills

### Step 1: Capability Audit
```
For each agent:
1. List all capabilities (what can it DO?)
2. Categorize: Unique vs Shared
3. Document: Inputs required, outputs produced
```

### Step 2: Extract Shared Skills
```
Find overlaps between agents:
- Tesla's market analysis + Buffett's financial review = analysis skill
- Aaron's research + Ghost's bookmark analysis = research skill
- Barnum's design + Ghost's visual QA = design skill
```

### Step 3: Refactor Agents as Orchestrators
```
Agent becomes:
- Identity (SOUL.md)
- Skill selection logic
- Tool preferences
- Communication style

NOT:
- Monolithic capability
- Duplicated functionality
- Siloed knowledge
```

## Current Skill Inventory

| Skill | Category | Status | Dependencies |
|-------|----------|--------|--------------|
| visual-qa | Analysis | ✅ Active | image tool |
| harness-audit | Analysis | ✅ Active | sessions_list, file read |
| visual-explainer | Generation | ✅ Active | file write, browser |
| raindrop-sync | Integration | ✅ Active | API, file write |
| skill-framework | Meta | 🆕 New | None |

## Migration Status

**Agents (Legacy):** 7 → 1 (Ghost only)
**Skills (Current):** 3 + framework
**Target:** Ghost orchestrates 10-15 composable skills

## Cost Comparison

| Approach | Monthly Cost | Maintenance |
|----------|-------------|-------------|
| 7 Agents (OpenRouter) | $290+/day | High (7 systems) |
| 1 Agent + Skills (Local) | $0/day | Low (shared components) |
| **Savings:** 100% | | |

---

*Skill Architecture Framework v1.0*
*Implements CRITICAL bookmark insights from Feb 20*
