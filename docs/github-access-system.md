# GitHub Access & Repository Management System

**Status:** Active | **Repository:** https://github.com/redlabelintel/ghost

## Overview

The GitHub integration provides persistent storage, version control, and documentation hosting for the Ghost Platform. Every document, script, and system configuration is committed to the repository with automated backups and continuity protocols.

## Repository Structure

```
ghost/
├── README.md                          # Main project overview
├── ghost-platform-spec.md             # Complete system architecture
├── ghost-agent-setup-guide.md         # Agent configuration guide
├── EMAIL_SERVICE.md                   # Email system documentation
├── PRINCIPLES.md                      # Operating principles
├── analysis/                          # X bookmark analyses
│   └── x_bookmark_analysis_*.md
├── memory/                            # Daily session logs
│   └── YYYY-MM-DD.md
├── agent-standups/                    # Meeting records
│   └── meetings/
├── command-center-dashboard/          # Dashboard specifications
├── scripts/                           # Operational scripts
│   ├── session-guardian.mjs
│   ├── safe-email-send.mjs
│   └── email-tracker.mjs
├── schemas/                           # Primitive schemas
├── primitives/                        # Structured metadata
└── docs/                              # System documentation
```

## Key Documentation Files

| File | Purpose | Link |
|------|---------|------|
| ghost-platform-spec.md | Complete system specification | https://github.com/redlabelintel/ghost/blob/main/ghost-platform-spec.md |
| ghost-agent-setup-guide.md | Agent configuration guide | https://github.com/redlabelintel/ghost/blob/main/ghost-agent-setup-guide.md |
| x-bookmarks-system.md | Bookmark analysis system | https://github.com/redlabelintel/ghost/blob/main/docs/x-bookmarks-system.md |
| github-access-system.md | This document | https://github.com/redlabelintel/ghost/blob/main/docs/github-access-system.md |
| himalaya-gmail-system.md | Email system | https://github.com/redlabelintel/ghost/blob/main/docs/himalaya-gmail-system.md |
| self-improvement-system.md | AI digest system | https://github.com/redlabelintel/ghost/blob/main/docs/self-improvement-system.md |
| memory-storage-system.md | Memory architecture | https://github.com/redlabelintel/ghost/blob/main/docs/memory-storage-system.md |

## Automation

### Auto-Save Protocol
- **Schedule:** Every hour via cron
- **Scope:** agent-standups/, command-center-dashboard/, memory/
- **Commit message:** "Auto-save: meeting docs [timestamp]"
- **Push:** Automatic to origin/main

### Sunday Cleanup
- **Schedule:** Weekly, Sunday 10 AM
- **Function:** Directory reorganization and archival
- **History:** 101 files reorganized in Phase 1

## Access Patterns

### Read Operations
- Raw content via `raw.githubusercontent.com`
- GitHub web interface for browsing
- Local clone for development work

### Write Operations
- Automatic commits via cron jobs
- Manual commits for documentation
- Push to main branch (no PR workflow for solo operation)

## Continuity Guarantees

1. **Daily Commits:** Minimum one commit per day
2. **Meeting Preservation:** Every standup document saved
3. **State Recovery:** Full reconstruction possible from repo alone
4. **Version History:** Complete change tracking via git log

## Integration Points

- **Command Center:** Links to dashboard specifications
- **Agent Spawning:** Documentation for sub-agents
- **Session Guardian:** Logs archived in repo
- **Memory System:** Daily logs committed automatically

## Security

- Private repository (redlabelintel/ghost)
- No secrets in committed files (redacted in config)
- App passwords and tokens in local config only
- Credentials: `~/.config/himalaya/config.toml` (not in repo)

## Cost

$0 — GitHub free tier sufficient for private repos under 2GB

---

*Repository initialized: February 2026*
*90+ commits | 7 agents | 12 cron jobs | $0/day operating cost*
