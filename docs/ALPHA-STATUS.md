# Alpha Status

## What exists now
- Monorepo with strict TypeScript across all packages
- Domain model: projects, tasks, runs, approvals, artifacts, events, commands, terminal sessions
- Tactical-minimal theme token seed
- Bridge-fed alpha workspace with file-backed persistence
- Componentized UI: AgentBoard, ApprovalPanel, TimelinePanel, CommandSurface, TerminalSurface
- BridgeContext for dependency injection (testable client layer)
- Shared mock snapshot fixture (single source of truth across runtime-bridge and client-sdk)
- Approval detail depth with error handling and user-visible error states
- Timeline filtering + synthetic live events
- Command surface with staged command actions and input validation
- Terminal/session scaffold with visible output, history parsing, and restored-state awareness
- Cross-platform CI (Linux, Windows, macOS)
- Electron sandbox enabled, dev server bound to localhost

## What this alpha proves
1. The product can be modeled around **projects, tasks, runs, approvals, artifacts, events, commands, and terminal sessions**.
2. The UI can be structured around a **Project Workspace** with focused, composable components instead of a monolithic view.
3. The visual language can carry a sci-fi tone without becoming unreadable.
4. Runtime actions can already affect timeline, approval state, command staging, and terminal output in one connected flow.
5. The bridge layer works reliably across platforms with proper error handling and input validation.

## Next implementation block
1. Deepen terminal session interaction
2. Model session history / command history with richer lifecycle
3. Add SQLite-backed local persistence for sessions, commands, events, approvals
4. Connect a real PTY path on top of that foundation
5. Add client-sdk and UI component tests (coverage currently below 80% target)

## Why this order
Because PTY without stable history/persistence becomes terminal theater. The product needs memory, auditability, and resumability before raw shell streaming becomes the centerpiece.
