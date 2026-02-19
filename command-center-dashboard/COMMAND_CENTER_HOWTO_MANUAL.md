# CEO Command Center - Complete How-To Guide
**Version:** Powered v2 with Warren Buffett CEO  
**Access URL:** http://100.76.103.90:8001/powered-dashboard-v2.html  
**Last Updated:** February 13, 2026 - 15:16 GMT+1

---

## 🚀 HOW TO ACCESS AND USE THE COMMAND CENTER

### Step 1: Opening the Command Center
1. **Open your web browser** (Chrome, Safari, Firefox)
2. **Navigate to:** http://100.76.103.90:8001/powered-dashboard-v2.html
3. **Wait for loading** - Should take 3-5 seconds
4. **Verify status:** Look for green dot next to "POWERED ONLINE"
5. **Check System Intelligence Log** - Should show initialization messages

**If showing offline:** Refresh page, check if backend API is running

### Step 2: Understanding the Interface Layout
The dashboard has **6 main panels** arranged in a grid:

**Column 1 (Left):**
- **System Intelligence Log** (first priority) - Shows real-time activity
- **Team Status** - Your specialist agents including Warren Buffett CEO

**Remaining Columns:**
- **Live Workspace** - Real workspace metrics and git operations
- **Executive Automation** - Auto-budget protection and optimization  
- **Warren's CEO Strategic Dashboard** - Warren Buffett's business metrics
- **Live Business Intelligence** - Real-time operational data
- **Real Operations** - Emergency controls and session management

---

## 🤖 HOW TO USE THE TEAM STATUS PANEL

### What This Panel Does
Shows your specialist agents and Warren Buffett CEO with live status indicators. Use this to deploy teams for specific projects.

### Step-by-Step: How to Deploy a Team
1. **Look at the team roster** - Each agent has a circular avatar and status
2. **Click [DEPLOY] SPECIALIZED TEAM** button at bottom of panel
3. **Enter team type when prompted:** architecture/data/security/ui/strategy
4. **Watch status change** - Deployed agents show "ACTIVE" status
5. **Monitor in System Intelligence Log** - See deployment confirmation

### Your Team Members

**Ghost (G) - ACTIVE**
- **What he does:** Coordinates all operations, manages Command Center
- **When to use:** Always available, primary operational coordinator
- **Status:** Always shows ACTIVE

**Tesla (T) - READY**  
- **What he does:** System architecture, backend design, infrastructure
- **When to use:** Building new systems, API development, technical planning
- **How to deploy:** Select "architecture" when prompted

**Aaron (A) - READY**
- **What he does:** Data analysis, metrics, pipeline development  
- **When to use:** Need analytics, data processing, performance optimization
- **How to deploy:** Select "data" when prompted

**Barnum (B) - READY**
- **What he does:** User interface design, user experience
- **When to use:** Frontend work, design improvements, user workflows
- **How to deploy:** Select "ui" when prompted

**Bond (J) - READY**
- **What he does:** Security, compliance, threat assessment
- **When to use:** Security audits, protection protocols, risk analysis  
- **How to deploy:** Select "security" when prompted

**Patton (P) - READY**
- **What he does:** Strategic planning, project execution
- **When to use:** Strategic planning, project coordination, execution oversight
- **How to deploy:** Select "strategy" when prompted

**Warren Buffett (W) - STRATEGIC**
- **What he does:** CEO-level strategic oversight with legendary business judgment
- **When to use:** Major decisions, capital allocation, long-term strategy
- **How to interact:** Use [CEO] REQUEST WARREN'S APPROVAL button
- **Special status:** Always shows STRATEGIC (executive level)

- **Patton (P)** - Strategy - Status: READY
  - *Role:* Strategic planning and execution
  - *Specialization:* Business strategy, project coordination, planning

#### Team Controls:
**[DEPLOY] SPECIALIZED TEAM**
- Click to deploy a specialized team for specific tasks
- Prompts for team type: architecture/data/security/ui/strategy
- Updates team status indicators to show active deployment
- Logs deployment actions in System Intelligence Log

---

## 💻 LIVE WORKSPACE PANEL

### Workspace Metrics
**Purpose:** Monitor real workspace activity and provide quick access to key functions.

#### Live Metrics Displayed:
- **Recent Commits**: Count of git commits made today
- **Active Projects**: Number of projects in development
- **Memory Files**: Current memory file count for operational continuity
- **Daily Todos**: Extracted todo items from workspace files

#### Workspace Controls:
**[OPEN] WORKSPACE**
- Opens Ghost repository in new tab: https://github.com/redlabelintel/ghost
- Provides direct access to all workspace files and documentation
- Logs workspace access in intelligence log

**[COMMIT] PROGRESS**  
- Executes git commit of current workspace changes
- Increments recent commits counter
- Logs commit action with timestamp
- *Note: Currently simulated - would execute real git operations*

---

## ⚡ EXECUTIVE AUTOMATION PANEL

### Automation Status Monitors:
- **Auto-Budget Guard**: Active monitoring of session costs with automatic enforcement
- **Session Optimizer**: Learning system patterns for intelligent optimization
- **Real API Integration**: Live connection status to OpenClaw backend systems

#### Executive Automation Controls:
**[EXECUTE] REAL BUDGET CONTROL**
- Connects to `/api/financial/enforce-limits` endpoint
- Executes actual budget enforcement via OpenClaw APIs
- Shows success/failure status in System Intelligence Log
- Prevents cost overruns through real system integration

**[EXECUTE] REAL OPTIMIZATION**  
- Performs actual system optimization steps:
  - Session resource usage analysis
  - Memory allocation optimization
  - Temporary file cleanup
  - Agent workload rebalancing
- Updates team status (Aaron shows "OPTIMIZING" during execution)
- Logs each optimization step with real progress tracking

---

## 📊 LIVE BUSINESS INTELLIGENCE PANEL

### Real-Time Metrics
**Purpose:** Display actual operational metrics from OpenClaw systems, not simulated data.

#### Displayed Metrics:
- **API Cost Today**: Real daily API spending from session activity
- **Active Sessions**: Current number of active OpenClaw sessions
- **Local Model Usage**: Percentage of operations using cost-free local models
- **Cost Savings**: Calculated savings from local model deployment

#### How Metrics Are Calculated:
- **API Cost**: Sum of all session costs from `/api/sessions/list`
- **Active Sessions**: Count from OpenClaw session data
- **Local Model Usage**: Percentage of sessions using qwen2.5-7b-instruct vs remote models
- **Cost Savings**: Estimated savings from 60-80% cost reduction via local models

---

## 🚨 REAL OPERATIONS PANEL

### Executive Controls
**Purpose:** Execute actual OpenClaw commands for immediate operational control.

#### Emergency Controls:
**[REAL] EMERGENCY PANIC**
- **Function**: Executes actual emergency protocols via `/api/emergency/panic`
- **Action**: Immediately pauses all non-critical operations
- **Confirmation**: Requires explicit confirmation before execution
- **Result**: Real session termination and system protection
- **Logging**: All actions logged for audit compliance

**[REAL] KILL EXPENSIVE**
- **Function**: Terminates actual sessions costing >$8 via `/api/sessions/kill-expensive`
- **Threshold**: $8.00 (configurable)
- **Confirmation**: Prompts for confirmation before execution
- **Result**: Real cost savings and budget protection
- **Feedback**: Shows number of sessions actually terminated

#### Operational Controls:
**[REAL] SPAWN AGENT**
- **Function**: Creates actual OpenClaw agent sessions
- **Prompts**: 
  - Agent specialization (research/analysis/monitoring/development)
  - Task description for agent assignment
- **Execution**: Uses OpenClaw sessions spawn functionality
- **Updates**: Increments session count in live metrics
- **Team Status**: Shows Tesla as "DEPLOYING" during agent creation

**[REAL] BACKUP WORKSPACE**
- **Function**: Executes actual git operations for workspace backup
- **Steps**: 
  1. Scans workspace for changes
  2. Adds modified files to git staging
  3. Creates commit with timestamp
  4. Pushes to remote repository (when implemented)
- **Updates**: Increments recent commits counter
- **Logging**: Each step logged in System Intelligence Log

---

## 📋 SYSTEM INTELLIGENCE LOG

### Purpose
Primary operational visibility panel showing real-time system activity, API responses, and automated actions.

### Log Types:
- **ℹ️ Info**: General system information and status updates
- **✅ Success**: Successful operations and confirmations
- **⚠️ Warning**: Warning conditions requiring attention
- **❌ Error**: Failed operations and error conditions  
- **🔗 Real**: API connections and real data integration events

### Log Sources:
- API health check responses
- Real workspace data loading events
- Executive control execution results
- Team deployment and status changes
- Automated system optimizations
- Error conditions and recovery actions

### Auto-Scrolling:
- Log automatically scrolls to show latest messages
- Maximum height prevents interface overflow
- Historical entries preserved for session duration

---

## 🔧 SYSTEM HEALTH MONITORING

### Status Indicators:
- **Green Dot**: All systems operational and API responding
- **Grey Dot**: System offline or API connection failed
- **Status Text**: "POWERED ONLINE" when operational
- **Timestamp**: Current time display for freshness verification

### Automatic Refresh:
- Status checked every 30 seconds
- Real workspace data refreshed every 30 seconds  
- Failed connections automatically retry
- System Intelligence Log shows all refresh activities

---

## ⚙️ CONFIGURATION & CUSTOMIZATION

### Current Thresholds:
- **Budget Kill Threshold**: $8.00 (sessions terminated above this cost)
- **Session Refresh**: 30-second intervals
- **Team Deployment**: 6 available specialists
- **Log Retention**: Session duration (refreshes on page reload)

### Customizable Elements:
- Budget enforcement thresholds
- Refresh intervals for real-time data
- Team deployment configurations
- Alert and notification preferences

---

## 🚀 ADVANCED FEATURES

### Behind-the-Scenes Automation:
- **Auto-Budget Monitoring**: Continuous session cost tracking
- **Predictive Optimization**: System learns usage patterns
- **Real-Time Integration**: Live connection to OpenClaw APIs
- **Team Coordination**: Automatic status updates for agent deployments
- **Workspace Synchronization**: Live file and project monitoring

### Future Enhancement Capabilities:
- **Voice Commands**: Integration ready for voice control
- **Mobile Access**: Responsive design supports mobile executive access
- **External Integrations**: Framework ready for calendar, email, CRM integration
- **Advanced Analytics**: Foundation prepared for predictive intelligence enhancement

---

## 🛠️ TROUBLESHOOTING

### Common Issues:

#### "Dashboard Shows Offline"
1. Check if backend API is running
2. Verify http://100.76.103.90:3001/api/health responds
3. If not, API server needs restart (automatic detection and fix implemented)

#### "Real Operations Not Working"
1. Confirm API endpoints are accessible
2. Check System Intelligence Log for error messages
3. Verify network connectivity to internal services

#### "Team Status Not Updating"
1. Refresh browser page to reinitialize
2. Check if JavaScript is enabled
3. Verify no browser console errors

#### "Metrics Showing '--'"
1. API integration may be down
2. Check backend server status
3. Allow 30 seconds for automatic data refresh

### Emergency Recovery:
If dashboard becomes unresponsive:
1. Refresh browser page
2. Check http://100.76.103.90:8001/powered-dashboard-v2.html accessibility
3. Verify backend server at http://100.76.103.90:3001/api/health
4. Contact system administrator if issues persist

---

## 📋 REGULAR MAINTENANCE

### Daily Operations:
- Monitor System Intelligence Log for any error messages
- Verify green status dot shows system health
- Review team deployment patterns for optimization opportunities
- Check real metrics for operational efficiency trends

### Weekly Review:
- Analyze cost savings and optimization effectiveness
- Review team utilization and deployment patterns  
- Update configurations based on usage patterns
- Backup and commit any configuration changes

### Monthly Assessment:
- Evaluate feature usage and enhancement opportunities
- Review automation effectiveness and optimization results
- Plan strategic improvements and capability expansions
- Document lessons learned and operational insights

---

**MANUAL STATUS**: ✅ COMPLETE AND OPERATIONAL  
**DESIGN VERSION**: Perfect (locked, no fundamental changes)  
**NEXT UPDATE**: When feature enhancements are implemented

---

*This manual covers all current functionality of the CEO Command Center Powered v2. Update this document whenever new features are added or existing functionality is modified.*