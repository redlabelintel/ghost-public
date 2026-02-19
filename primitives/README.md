# ClawVault-Style Primitive System

**Status**: Active | **Deployed**: February 17, 2026

A file-based primitive architecture inspired by Pedro's ClawVault system, providing structured metadata, traceability, and auto-generation for agent operations.

---

## Overview

This system implements **primitives over frameworks** — simple, composable building blocks that enable complex behaviors without the overhead of complex orchestration layers.

### Core Philosophy

> "Powerful, Elegant Primitives are all you need" — Pedro

- **Primitives**: Markdown files with YAML frontmatter
- **Universal Format**: Files any LLM already knows how to read/write/search
- **No Dependencies**: No required database, cloud API, vendor lock-in
- **Composable**: Individual primitives combine into complex behaviors
- **Self-Managing**: Agents can create and manage their own primitives

---

## Directory Structure

```
workspace/
├── schemas/                          # YAML schema definitions
│   ├── agent-rule.yaml              # Structure for AGENTS.md
│   ├── identity.yaml                # Structure for SOUL.md
│   ├── lesson.yaml                  # Structure for MEMORY.md
│   ├── decision.yaml                # Decision records
│   ├── task.yaml                    # Task tracking
│   └── project.yaml                 # Project management
│
├── primitives/                       # Auto-generated primitives
│   ├── task/                        # Actionable work items
│   ├── decision/                    # Important decisions
│   ├── lesson/                      # Learnings and insights
│   └── project/                     # Higher-level initiatives
│
└── scripts/
    └── primitive-generator.mjs      # Auto-generation tool
```

---

## Primitive Types

### 1. Agent Rule (`agent-rule`)
**Used in**: AGENTS.md
**Purpose**: Configuration rules and behavioral guidelines
**Example**:
```yaml
---
type: agent-rule
version: "2.0"
last_updated: 2026-02-17
author: CEO
tags: [behavior, boundaries]
priority: critical
applies_to: [all]
related_primitives:
  - primitives/decision/cost-policy-2026-02-13.md
status: active
---
```

### 2. Identity (`identity`)
**Used in**: SOUL.md
**Purpose**: Agent personality, vibe, and self-concept
**Example**:
```yaml
---
type: identity
version: "1.0"
name: "Ghost"
creature: "AI assistant"
vibe: "Sharp, resourceful"
emoji: "👻"
core_values:
  - competence over performance
  - privacy is non-negotiable
evolution_log:
  - date: 2026-02-17
    change: "Added YAML frontmatter"
    reason: "Implementing primitive system"
---
```

### 3. Lesson (`lesson`)
**Used in**: MEMORY.md
**Purpose**: Learnings, insights, accumulated wisdom
**Example**:
```yaml
---
type: lesson
date_learned: 2026-02-13
category: operational
importance: 5
source: "Context bleed incident"
tags: [monitoring, cost-control]
related_decisions:
  - primitives/decision/guardian-upgrade.md
status: active
---
```

### 4. Decision (`decision`)
**Purpose**: Record of important decisions made
**Links to**: Tasks, lessons
**Fields**: decision, rationale, consequences, options_considered

### 5. Task (`task`)
**Purpose**: Actionable work items
**Links to**: Decisions, lessons, other tasks (depends_on)
**Fields**: title, owner, priority, status, due_date

### 6. Project (`project`)
**Purpose**: Higher-level initiatives
**Links to**: Tasks, decisions, lessons
**Fields**: name, description, status, success_criteria

---

## The Magic of Linking

Primitives link to each other creating **traceable causal chains**:

```
Lesson (Context bleed discovered)
    ↓
Decision (Lower thresholds + add monitoring)
    ↓
Task (Update Session Guardian config)
    ↓
Task (Add Critical Monitoring panel)
    ↓
Lesson (Validation: thresholds work)
```

### Link Types

- `related_decisions`: Decisions that created/impact this primitive
- `related_tasks`: Tasks generated from this primitive
- `related_lessons`: Lessons applicable to this primitive
- `depends_on`: Tasks that must complete first
- `superseded_by`: Newer version of this primitive

---

## Auto-Generation

### From Command Line
```bash
# Create a task
node scripts/primitive-generator.mjs task "Update Session Guardian" "Lower thresholds"

# Create a decision
node scripts/primitive-generator.mjs decision "Adopt local models" "Cost reduction"

# Create a lesson
node scripts/primitive-generator.mjs lesson "Simple primitives beat complex frameworks"
```

### From Conversation (Auto-Extract)
```bash
# Extract primitives from conversation text
node scripts/primitive-generator.mjs extract "We decided to use local models. We need to test the setup."
# Output:
#   1. [decision] use local models
#   2. [task] test the setup
```

### From Code (Programmatic)
```javascript
import { createTask, createDecision, createLesson } from './primitive-generator.mjs';

const task = createTask({
  title: "Deploy YAML schemas",
  description: "Create schema definitions",
  priority: "high",
  relatedDecisions: ["primitives/decision/adopt-clawvault.md"]
});
```

---

## Integration with Existing Files

### Updated Files with Frontmatter

1. **AGENTS.md** - Now has YAML frontmatter with:
   - Type: agent-rule
   - Version tracking
   - Related primitives (decisions, lessons)
   - Priority level

2. **SOUL.md** - Now has YAML frontmatter with:
   - Type: identity
   - Core values list
   - Boundaries list
   - Evolution log

3. **MEMORY.md** - Can use lesson schema with:
   - Date learned
   - Importance rating
   - Source attribution
   - Related links

---

## Validation

### Schema Validation
Schemas define:
- **Required fields**: Must be present
- **Type checking**: String, number, date, array
- **Enums**: Valid values for categorical fields
- **Patterns**: Regex for structured data (versions, dates)
- **Ranges**: Min/max for numeric fields

### Example Validation Rules
```yaml
validation:
  - field: version
    rule: semver
    message: "Version must be semantic (e.g., 1.0)"
    
  - field: importance
    rule: range
    min: 1
    max: 5
    message: "Importance must be 1-5"
```

---

## Benefits

### 1. Structured Metadata
- Version tracking
- Date management
- Priority levels
- Status workflows

### 2. Traceability
- See decision → task → lesson chains
- Understand why things were done
- Track evolution over time

### 3. Queryability
- Find all high-priority tasks
- Get all lessons from specific category
- List all decisions by date
- Filter by tags

### 4. Self-Documentation
- Files explain themselves
- Links provide context
- History is preserved

### 5. Agent-Generated
- Zero documentation overhead
- Meetings auto-generate records
- Decisions captured automatically
- Lessons extracted from conversations

---

## Success Criteria

- [x] Schema definitions created for all primitive types
- [x] Core files (AGENTS.md, SOUL.md) have valid frontmatter
- [x] Auto-generation script functional
- [x] Example primitives created
- [x] Documentation complete
- [ ] Primitive linking system in active use
- [ ] Auto-extraction from conversations deployed
- [ ] Query capabilities implemented

---

## Next Steps

1. **Immediate**: Use auto-generation in next standup
2. **This Week**: Create primitives from recent decisions
3. **This Month**: Implement query/search across primitives
4. **Next Quarter**: Full self-managing agent system

---

## References

- **Pedro's ClawVault**: https://x.com/sillydarket/status/2023232371038757328
- **Analysis**: analysis/x_bookmark_analysis_pedro_clawvault_primitives.md

---

**Deployed**: February 17, 2026  
**Status**: Active  
**Owner**: Ghost
