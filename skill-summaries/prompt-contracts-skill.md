# Prompt Contracts - Claude Skill Summary

## Overview

**Prompt Contracts** is a prompt engineering methodology developed by OpenAI engineers that achieves superior AI performance without relying on "act as an expert" role-playing, chain-of-thought reasoning, or mega-prompts with extensive context.

**Core Insight:** Most prompts fail because they give "vibes, not instructions" — causing the AI to guess what you want. Guessing produces garbage output.

## The Technique

Instead of telling the AI *how* to think, you define the **contract** — the input/output specification, constraints, and success criteria.

### The Four Elements of a Prompt Contract

**1. GOAL (Exact Success Metric)**
- Define what success looks like in measurable terms
- Example: "40% open rate (B2B SaaS founders)" not "make it engaging"

**2. CONSTRAINTS (Hard Boundaries)**
- Non-negotiable limits the AI must respect
- Example: "<150 words, no hype language, include 1 stat"

**3. OUTPUT FORMAT (Specific Structure)**
- Precise format for the deliverable
- Example: "Subject line + 3 paragraphs + CTA button text"

**4. FAILURE CONDITIONS (What Breaks It)**
- Measurable criteria that invalidate the output
- Example: "FAILURE if contains: game-changing, revolutionary, innovative OR uses passive voice >10%"

## Before/After Example

### ❌ Traditional Prompt
```
Write an email about our product launch. Make it engaging.
```
**Result:** Generic corporate language, vague positioning, unpredictable output quality.

### ✅ Prompt Contract
```
Write product launch email.

GOAL: 40% open rate (B2B SaaS founders)
CONSTRAINTS: <150 words, no hype language, include 1 verifiable stat
FORMAT: Subject line + 3 bullet points + 1-sentence CTA
FAILURE if: Uses "revolutionary," "game-changing," "innovative," passive voice >10%, or exceeds word count
```
**Result:** Specific, measurable, optimized output that can be validated against explicit criteria.

## Why It Works

**Traditional approach:** AI guesses intent → inconsistent quality
**Prompt Contracts:** AI optimizes against explicit constraints → measurable, repeatable quality

The key innovation is defining **failure conditions** — giving the AI something concrete to avoid rather than vague instructions to follow.

## Claude Skill Implementation

### Template Structure
```
TASK: [brief description]

GOAL: [measurable success metric]
CONSTRAINTS: [hard boundaries]
FORMAT: [specific output structure]
FAILURE if: [measurable invalidation criteria]
```

### Use Cases

**Content Generation:** Blog posts, emails, marketing copy with brand voice constraints
**Code Review:** Define specific anti-patterns to flag, security requirements
**Data Analysis:** Specify output format, statistical thresholds, visualization requirements
**Research Synthesis:** Set scope boundaries, citation requirements, summary length

### Best Practices

1. **Make goals quantifiable** — "increase clarity" becomes "Flesch reading score >60"
2. **Constraints are hard limits** — not suggestions
3. **Failure conditions must be testable** — binary yes/no evaluation
4. **Think legal contract, not creative brief** — precision over inspiration

## Comparison to Other Techniques

| Technique | Approach | Best For |
|-----------|----------|----------|
| Role-playing ("act as expert") | Persona-based | Creative writing, style emulation |
| Chain-of-thought | Step-by-step reasoning | Complex problem-solving |
| Few-shot examples | Pattern matching | Format consistency |
| **Prompt Contracts** | **Constraint optimization** | **Measurable, repeatable outputs** |

## Source

Technique leaked by former OpenAI engineer, documented by Jainam Parmar (@aiwithjainam) on X/Twitter, February 2026.

**Original Thread:** https://x.com/aiwithjainam/status/2022248977194954787

## Claude Integration

This technique can be implemented as a Claude skill that:
1. Takes user input and converts it to Prompt Contract format
2. Validates outputs against defined failure conditions
3. Iterates based on measurable success metrics
4. Maintains constraint consistency across sessions

**Expected Benefits:**
- 20-30% reduction in token usage (fewer clarification cycles)
- Higher consistency in output quality
- Faster iteration with measurable feedback loops
- Reduced hallucination through explicit constraints