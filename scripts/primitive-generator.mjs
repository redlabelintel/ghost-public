#!/usr/bin/env node
/**
 * Primitive Auto-Generator
 * Automatically creates task/decision/lesson primitives from conversations
 * Part of the ClawVault-inspired primitive system
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRIMITIVES_DIR = join(__dirname, '..', 'primitives');

// Ensure primitive directories exist
const dirs = ['task', 'decision', 'lesson', 'project'];
dirs.forEach(dir => {
  const path = join(PRIMITIVES_DIR, dir);
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
});

/**
 * Generate a task primitive
 */
export function createTask(options) {
  const {
    title,
    description = '',
    owner = 'Ghost',
    priority = 'medium',
    dueDate = null,
    tags = [],
    relatedDecisions = [],
    relatedLessons = [],
    dependsOn = []
  } = options;

  const date = new Date().toISOString().split('T')[0];
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${date}-${slug}.md`;
  const filepath = join(PRIMITIVES_DIR, 'task', filename);

  const frontmatter = {
    type: 'task',
    created_date: date,
    title,
    description,
    owner,
    priority,
    status: 'open',
    due_date: dueDate,
    tags,
    depends_on: dependsOn,
    related_decisions: relatedDecisions,
    related_lessons: relatedLessons
  };

  const content = generateMarkdown(frontmatter, `# ${title}\n\n${description}`);
  writeFileSync(filepath, content);
  
  return { filepath, filename, type: 'task' };
}

/**
 * Generate a decision primitive
 */
export function createDecision(options) {
  const {
    decision,
    context = '',
    decider = 'CEO',
    rationale = '',
    optionsConsidered = [],
    consequences = [],
    relatedTasks = [],
    reviewDate = null
  } = options;

  const date = new Date().toISOString().split('T')[0];
  const slug = decision.toLowerCase()
    .substring(0, 50)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${date}-${slug}.md`;
  const filepath = join(PRIMITIVES_DIR, 'decision', filename);

  const frontmatter = {
    type: 'decision',
    date_decided: date,
    decider,
    context,
    options_considered: optionsConsidered,
    decision,
    rationale,
    consequences,
    related_tasks: relatedTasks,
    status: 'active',
    review_date: reviewDate
  };

  const body = `# Decision: ${decision}\n\n## Context\n\n${context}\n\n## Rationale\n\n${rationale}`;
  const content = generateMarkdown(frontmatter, body);
  writeFileSync(filepath, content);
  
  return { filepath, filename, type: 'decision' };
}

/**
 * Generate a lesson primitive
 */
export function createLesson(options) {
  const {
    lesson,
    category = 'operational',
    importance = 3,
    source = '',
    tags = [],
    relatedDecisions = [],
    relatedTasks = []
  } = options;

  const date = new Date().toISOString().split('T')[0];
  const slug = lesson.toLowerCase()
    .substring(0, 50)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${date}-${slug}.md`;
  const filepath = join(PRIMITIVES_DIR, 'lesson', filename);

  const frontmatter = {
    type: 'lesson',
    date_learned: date,
    category,
    importance,
    source,
    tags,
    related_decisions: relatedDecisions,
    related_tasks: relatedTasks,
    status: 'active'
  };

  const body = `# Lesson: ${lesson}\n\n${source ? `**Source:** ${source}\n\n` : ''}${lesson}`;
  const content = generateMarkdown(frontmatter, body);
  writeFileSync(filepath, content);
  
  return { filepath, filename, type: 'lesson' };
}

/**
 * Generate a project primitive
 */
export function createProject(options) {
  const {
    name,
    description = '',
    owner = 'Ghost',
    targetCompletion = null,
    successCriteria = [],
    tasks = [],
    decisions = []
  } = options;

  const date = new Date().toISOString().split('T')[0];
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${date}-${slug}.md`;
  const filepath = join(PRIMITIVES_DIR, 'project', filename);

  const frontmatter = {
    type: 'project',
    start_date: date,
    name,
    description,
    owner,
    status: 'active',
    target_completion: targetCompletion,
    tasks,
    decisions,
    success_criteria: successCriteria
  };

  const body = `# Project: ${name}\n\n${description}`;
  const content = generateMarkdown(frontmatter, body);
  writeFileSync(filepath, content);
  
  return { filepath, filename, type: 'project' };
}

/**
 * Generate markdown with YAML frontmatter
 */
function generateMarkdown(frontmatter, body) {
  // Remove null/undefined values and empty arrays
  const cleanFm = Object.fromEntries(
    Object.entries(frontmatter)
      .filter(([_, v]) => v !== null && v !== undefined && 
        !(Array.isArray(v) && v.length === 0))
  );

  const yaml = Object.entries(cleanFm)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
      }
      return `${key}: ${value}`;
    })
    .filter(Boolean)
    .join('\n');

  return `---\n${yaml}\n---\n\n${body}\n`;
}

/**
 * Extract primitives from conversation text
 * Simple pattern matching to auto-create primitives
 */
export function extractFromConversation(text) {
  const primitives = [];

  // Look for decision patterns
  const decisionPatterns = [
    /decided?\s+(?:that\s+)?(?:we\s+)?(?:should\s+)?(.+?)(?:\.|\n|$)/gi,
    /(?:new\s+)?rule:\s*(.+?)(?:\.|\n|$)/gi,
    /(?:agreed|committed)\s+(?:to\s+)?(.+?)(?:\.|\n|$)/gi
  ];

  decisionPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const decision = match[1].trim();
      if (decision.length > 10 && decision.length < 200) {
        primitives.push({
          type: 'decision',
          data: { decision, rationale: 'Extracted from conversation' }
        });
      }
    }
  });

  // Look for task patterns
  const taskPatterns = [
    /(?:need\s+to|should|must|let's)\s+(.+?)(?:\.|\n|$)/gi,
    /(?:action\s+item|todo|task):\s*(.+?)(?:\.|\n|$)/gi
  ];

  taskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const task = match[1].trim();
      if (task.length > 5 && task.length < 150) {
        primitives.push({
          type: 'task',
          data: { title: task, description: task }
        });
      }
    }
  });

  // Look for lesson patterns
  const lessonPatterns = [
    /(?:learned|realized|discovered)\s+(?:that\s+)?(.+?)(?:\.|\n|$)/gi,
    /(?:lesson|insight):\s*(.+?)(?:\.|\n|$)/gi
  ];

  lessonPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const lesson = match[1].trim();
      if (lesson.length > 10 && lesson.length < 200) {
        primitives.push({
          type: 'lesson',
          data: { lesson, source: 'Conversation extraction' }
        });
      }
    }
  });

  return primitives;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'task':
      const task = createTask({
        title: process.argv[3] || 'Untitled Task',
        description: process.argv[4] || ''
      });
      console.log(`Created task: ${task.filepath}`);
      break;
      
    case 'decision':
      const decision = createDecision({
        decision: process.argv[3] || 'Untitled Decision',
        rationale: process.argv[4] || ''
      });
      console.log(`Created decision: ${decision.filepath}`);
      break;
      
    case 'lesson':
      const lesson = createLesson({
        lesson: process.argv[3] || 'Untitled Lesson'
      });
      console.log(`Created lesson: ${lesson.filepath}`);
      break;
      
    case 'extract':
      const text = process.argv[3] || '';
      const extracted = extractFromConversation(text);
      console.log(`Extracted ${extracted.length} primitives:`);
      extracted.forEach((p, i) => {
        console.log(`  ${i + 1}. [${p.type}] ${p.data.title || p.data.decision || p.data.lesson}`);
      });
      break;
      
    default:
      console.log(`
Primitive Auto-Generator

Usage:
  node primitive-generator.mjs task "Task Title" "Description"
  node primitive-generator.mjs decision "Decision text" "Rationale"
  node primitive-generator.mjs lesson "What was learned"
  node primitive-generator.mjs extract "Conversation text to analyze"

Examples:
  node primitive-generator.mjs task "Update Session Guardian" "Lower thresholds"
  node primitive-generator.mjs decision "Adopt local models" "Cost reduction"
  node primitive-generator.mjs extract "We decided to use local models. We need to test the setup."
`);
  }
}
