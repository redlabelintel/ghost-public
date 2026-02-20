# Ghost Skill Architecture

**Single-agent, modular skill system**

**Version:** 1.0.0  
**Agent:** Ghost (solo)  
**Philosophy:** One agent, many skills

---

## The Problem with Multiple Agents

Having 7 agents (Tesla, Aaron, Barnum, Bond, Patton, Buffett, Ghost) created:
- **Duplication:** Same capabilities across agents
- **Maintenance:** Update 7x for every improvement
- **Confusion:** Which agent for which task?
- **Cost:** 7x the context/compute overhead

## The Solution: Skill Architecture

**One agent (Ghost) + Modular skill library**

```
┌─────────────────────────────────────────┐
│           GHOST (Single Agent)          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     Skill Router / Dispatcher   │    │
│  │  (Determines which skill to use)│    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│    ┌────────────┼────────────┐          │
│    │            │            │          │
│    ▼            ▼            ▼          │
│ ┌──────┐   ┌──────┐   ┌──────┐         │
│ │Visual│   │Design│   │Data  │         │
│ │  QA  │   │System│   │Pipeline        │
│ └──────┘   └──────┘   └──────┘         │
│                                         │
│ ┌──────┐   ┌──────┐   ┌──────┐         │
│ │Content│  │Research│  │Analysis│       │
│ │Gen   │   │      │   │      │         │
│ └──────┘   └──────┘   └──────┘         │
│                                         │
└─────────────────────────────────────────┘
```

---

## How It Works

### 1. Task Arrives
```
User: "Review this UI screenshot"
```

### 2. Skill Router Analyzes
```
Ghost internal:
- What type of task? → Visual/UI review
- Which skill applies? → visual-qa
- Load skill module → /skills/visual-qa/
- Execute with skill framework
```

### 3. Skill Executes
```
Using visual-qa skill:
- Apply UI review methodology
- Check spacing, alignment, color
- Generate structured report
```

### 4. Response
```
Deliver results in skill's output format
```

---

## Skill Library Structure

```
skills/
├── README.md                    # Skill registry
├── SKILL_TEMPLATE/              # Template for new skills
│   ├── SKILL.md                # Documentation
│   ├── skill.js                # Implementation
│   └── examples/               # Usage examples
│
├── visual-qa/                   # ✅ Active
│   ├── SKILL.md
│   ├── visual-qa.js
│   └── examples/
│
├── apple-design-system/         # ✅ Active
│   ├── SKILL.md
│   ├── system-prompt.txt
│   ├── mcp-server.js
│   └── QUICKSTART.md
│
├── content-generation/          # 🟡 Planned
├── data-pipeline/               # 🟡 Planned
├── research-analysis/           # 🟡 Planned
└── api-integration/             # 🟡 Planned
```

---

## Skill Interface Standard

Every skill follows this contract:

### 1. SKILL.md (Documentation)
```markdown
# Skill Name

**Skill ID:** `skill-id`
**Type:** [category]
**Version:** x.x.x

## Overview
What this skill does

## When to Use
- Use this skill when...
- Don't use when...

## Input
Required parameters

## Output
Expected return format

## Examples
Usage examples
```

### 2. skill.js (Implementation)
```javascript
/**
 * Skill: [name]
 * Standard interface for Ghost skill architecture
 */

// Skill metadata
const META = {
  id: 'skill-id',
  name: 'Skill Name',
  version: '1.0.0',
  type: 'category',
  dependencies: []
};

// Main execution function
async function execute(input, context = {}) {
  // Skill logic here
  // Return standardized output
}

// Validation
function validateInput(input) {
  // Validate required parameters
  // Return { valid: boolean, errors: [] }
}

// Format output
function formatOutput(result) {
  // Standardize output format
  // Return structured object
}

module.exports = {
  META,
  execute,
  validateInput,
  formatOutput
};
```

---

## Skill Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Visual** | Image/UI analysis | visual-qa, design-review |
| **Creative** | Content generation | apple-design-system, copywriting |
| **Technical** | Code/data processing | data-pipeline, api-integration |
| **Research** | Information gathering | bookmark-analysis, trend-research |
| **Analysis** | Data interpretation | cost-analysis, performance-review |
| **Communication** | Output formatting | report-generation, presentation |

---

## Skill Router Logic

```javascript
// Pseudo-code for skill selection

function selectSkill(task) {
  // Analyze task description
  const analysis = analyzeTask(task);
  
  // Match to skill categories
  if (analysis.contains('screenshot', 'UI', 'design review')) {
    return 'visual-qa';
  }
  
  if (analysis.contains('design system', 'brand', 'colors')) {
    return 'apple-design-system';
  }
  
  if (analysis.contains('bookmark', 'analyze', 'research')) {
    return 'bookmark-analysis';
  }
  
  if (analysis.contains('data', 'pipeline', 'processing')) {
    return 'data-pipeline';
  }
  
  // Default to general capability
  return 'default';
}
```

---

## Using Skills in Practice

### Example 1: UI Review
```
User: "Check this dashboard design"

Ghost:
1. Task analysis → Visual review needed
2. Load skill: visual-qa
3. Execute: Analyze screenshot
4. Output: Structured QA report
```

### Example 2: Design System
```
User: "Create a brand for my startup"

Ghost:
1. Task analysis → Design system needed
2. Load skill: apple-design-system
3. Execute: Run 10 prompts sequentially
4. Output: Complete design system docs
```

### Example 3: Bookmark Analysis
```
User: "Analyze these bookmarks"

Ghost:
1. Task analysis → Research analysis needed
2. Load skill: bookmark-analysis
3. Execute: Fetch, analyze, summarize
4. Output: Structured analysis with action items
```

---

## Benefits of Skill Architecture

| Benefit | Description |
|---------|-------------|
| **Modularity** | Add/remove skills without affecting core |
| **Reusability** | Same skill across different tasks |
| **Maintainability** | Update one skill, applies everywhere |
| **Clarity** | Clear skill boundaries and responsibilities |
| **Extensibility** | Easy to add new capabilities |
| **Cost Efficiency** | One agent context vs. multiple |
| **Consistency** | Standardized outputs per skill |

---

## Adding New Skills

### Step 1: Create Skill Directory
```bash
mkdir skills/new-skill-name
cd skills/new-skill-name
```

### Step 2: Create Files
```
skills/new-skill-name/
├── SKILL.md          # Documentation
├── skill.js          # Implementation
└── examples/         # Usage examples
    └── example-1.js
```

### Step 3: Follow Standard Interface
- Export `META`, `execute`, `validateInput`, `formatOutput`
- Document in SKILL.md
- Add to skills/README.md registry

### Step 4: Test
```javascript
const skill = require('./skills/new-skill-name/skill');
const result = await skill.execute(testInput);
console.log(result);
```

### Step 5: Commit
```bash
git add skills/new-skill-name/
git commit -m "Add [skill-name] skill"
git push
```

---

## Current Skill Registry

| Skill | Status | Category | Description |
|-------|--------|----------|-------------|
| visual-qa | ✅ Active | Visual | UI screenshot review |
| apple-design-system | ✅ Active | Creative | Design system generation |
| bookmark-analysis | 🟡 Planned | Research | X bookmark analysis |
| data-pipeline | 🟡 Planned | Technical | Data processing workflows |
| content-generation | 🟡 Planned | Creative | Marketing content creation |
| api-integration | 🟡 Planned | Technical | External API connectors |

---

## Migration from Multi-Agent

### Old Way (7 Agents)
```
User: "Review UI"
→ Spawn Barnum (UX agent)
→ Barnum does review
→ Return result
```

### New Way (1 Agent + Skills)
```
User: "Review UI"
→ Ghost loads visual-qa skill
→ Execute review
→ Return result
```

**Same capability, simpler architecture.**

---

## Implementation Status

- ✅ Visual QA skill: Complete
- ✅ Apple Design System skill: Complete
- 🟡 Skill router: Basic implementation
- 🟡 Remaining skills: Planned
- 🟡 Documentation: In progress

---

*Ghost Skill Architecture v1.0*  
*Single agent, modular capabilities*
