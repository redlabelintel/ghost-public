#!/usr/bin/env node
/**
 * Skill Composer
 * Automatically chains multiple skills for complex tasks
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

// Skill registry
const SKILL_REGISTRY = {
  'visual-qa': {
    file: 'visual-qa/visual-qa.js',
    category: 'visual',
    inputs: ['screenshot', 'mockup'],
    outputs: ['violations', 'score']
  },
  'apple-design-system': {
    file: 'apple-design-system/SKILL.md',
    category: 'creative',
    inputs: ['brandName', 'description'],
    outputs: ['designSystem']
  },
  'agent-readability-audit': {
    file: 'agent-readability-audit/audit.js',
    category: 'analysis',
    inputs: ['url'],
    outputs: ['report']
  }
};

// Auto-detect which skills to use
function detectSkills(task) {
  const skills = [];
  const task_lower = task.toLowerCase();
  
  if (task_lower.includes('screenshot') || task_lower.includes('ui') || task_lower.includes('design review')) {
    skills.push('visual-qa');
  }
  
  if (task_lower.includes('brand') || task_lower.includes('design system') || task_lower.includes('color')) {
    skills.push('apple-design-system');
  }
  
  if (task_lower.includes('website') || task_lower.includes('audit') || task_lower.includes('analyze site')) {
    skills.push('agent-readability-audit');
  }
  
  return skills;
}

// Execute skill chain
async function compose(task, context = {}) {
  console.log('🔧 Skill Composer');
  console.log('=================');
  console.log(`Task: ${task}`);
  console.log('');
  
  const skills = detectSkills(task);
  
  if (skills.length === 0) {
    console.log('No specific skills detected. Using default capability.');
    return null;
  }
  
  console.log(`Skills to execute: ${skills.join(' → ')}`);
  console.log('');
  
  const results = [];
  
  for (const skillId of skills) {
    console.log(`Executing: ${skillId}`);
    const skill = SKILL_REGISTRY[skillId];
    
    if (!skill) {
      console.log(`  ❌ Skill not found: ${skillId}`);
      continue;
    }
    
    // Check if skill file exists
    const skillPath = path.join(SKILLS_DIR, skill.file);
    if (!fs.existsSync(skillPath)) {
      console.log(`  ❌ Skill file missing: ${skill.file}`);
      continue;
    }
    
    console.log(`  ✅ Skill available: ${skill.category}`);
    results.push({ skill: skillId, category: skill.category, path: skillPath });
  }
  
  return {
    task,
    skills: results,
    recommendation: generateRecommendation(results)
  };
}

function generateRecommendation(results) {
  if (results.length === 0) return 'Use general capabilities';
  if (results.length === 1) return `Use ${results[0].skill} skill`;
  return `Chain: ${results.map(r => r.skill).join(' → ')}`;
}

// CLI
async function main() {
  const task = process.argv.slice(2).join(' ');
  
  if (!task) {
    console.log(`
Skill Composer

Usage:
  node skill-composer.js "<task description>"

Examples:
  node skill-composer.js "Review this UI screenshot"
  node skill-composer.js "Create a brand design system"
  node skill-composer.js "Audit my website for agents"
`);
    process.exit(1);
  }
  
  const result = await compose(task);
  
  if (result) {
    console.log('');
    console.log('=================');
    console.log('Recommendation:', result.recommendation);
  }
}

if (require.main === module) {
  main();
}

module.exports = { compose, detectSkills, SKILL_REGISTRY };
