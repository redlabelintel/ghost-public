# Agent Standup Meeting Protocol

## Overview
Daily standup meetings for the Command Center Dashboard sprint team to ensure alignment, track progress, and maintain momentum.

## Meeting Types

### MORNING Standup (9:00 AM)
**Focus:** Planning and preparation
- Today's priorities
- Blockers to resolve
- Resource needs
- Risk alerts

### EVENING Standup (7:30 PM)
**Focus:** Review and reflection
- Day's accomplishments
- What went well vs what didn't
- Lessons learned
- Planning for tomorrow

## Team Roster

| Agent | Role | Specialization | Avatar |
|-------|------|----------------|--------|
| Ghost | Coordinator | Task execution, integration | 👻 |
| Tesla | Chief Architect | System design, infrastructure | ⚡ |
| Aaron | Data Pipeline Engineer | Data integration, APIs | 🔌 |
| Barnum | UX/UI Designer | User experience, interfaces | 🎨 |
| Bond | Security Engineer | Security, compliance | 🔒 |
| Patton | Strategy Lead | Sprint planning, coordination | 🎯 |
| Warren Buffett | CEO | Strategic oversight, approvals | 💼 |

## Standup Format

### 1. Data Gathering (Automated)
- Pull git commit history for the day
- Check active sessions and system status
- Review memory logs and decisions made
- Gather metrics on deliverables completed

### 2. Simulated Meeting
Each agent reports:
1. **Accomplishments** - What they completed today
2. **Blockers** - What stopped them (if any)
3. **Dependencies** - What they need from others
4. **Tomorrow** - What's planned next

### 3. Executive Summary
CEO (Warren Buffett) provides:
- Strategic assessment of day's progress
- Capital allocation decisions (time/resources)
- Risk evaluation
- Priorities for tomorrow

### 4. State Updates
- Update project status files
- Log to memory system
- Commit standup record to repository

### 5. Report Distribution
- Send summary to CEO
- Post to appropriate channel
- Archive for historical reference

## Output Format

### Evening Standup Report Structure
```
# Evening Agent Standup — [DATE]

## 📊 Day at a Glance
- Total commits: [N]
- Deliverables completed: [N]
- Critical decisions: [N]
- Blockers resolved: [N]

## ✅ Accomplishments by Agent

### [Agent Name]
- [Specific accomplishment]
- [Specific accomplishment]
- **Blockers:** [Any blockers]
- **Tomorrow:** [Plans]

## 🎯 Strategic Assessment (CEO)
[Warren Buffett's perspective on day's progress]

## 📈 Key Metrics
- Sprint progress: [X]%
- Budget health: [status]
- System status: [status]
- Risk level: [status]

## ⚠️ Lessons Learned
1. [Lesson]
2. [Lesson]

## 🎯 Tomorrow's Priorities
1. [Priority]
2. [Priority]

---
*Standup completed at [TIME]*
```

## Execution Steps

1. **Read this protocol** (you just did)
2. **Gather data** - Check git commits, sessions, memory
3. **Run simulated meeting** - Each agent reports status
4. **Generate summary report** - Following format above
5. **Update state files** - Write to meetings/ directory
6. **Log to memory** - Store key learnings
7. **Send report** - Deliver to CEO

## File Locations

- Standup records: `agent-standups/meetings/YYYY-MM-DD-HHMM.md`
- Memories: `agent-standups/memories/` (key learnings)
- Git repo: `/Users/ghost/.openclaw/workspace`
- Project: `/Users/ghost/.openclaw/workspace/command-center-dashboard/`
