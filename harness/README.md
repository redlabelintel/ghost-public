# Harness Control Plane

Agent harness: the control layer that governs agent behavior, separate from the framework that builds it.

## Components

### Session Management
- Lifecycle control (start, pause, resume, terminate)
- Context window governance
- Cost/rate limit enforcement

### Tool Governance
- Timeout configuration
- Retry logic
- Fallback chains
- Call validation

### Memory Management
- Recall/stor age policies
- Recency weighting
- Context injection

### Error Recovery
- Failure detection
- Automatic retry
- Session handoff triggers

## Usage

Each component has middleware specs defining how the harness enforces control:

- `session/` — Context limits, handoff triggers
- `tool/` — Timeouts, retries, validation
- `memory/` — Retrieval policies, ranking
- `error/` — Recovery flows, alerting

---

*Harness > Framework. Control > Building blocks.*
