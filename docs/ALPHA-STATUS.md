# Alpha Status

## What exists now
- initial repo scaffold
- domain model seed types
- tactical-minimal theme token seed
- bridge-fed alpha workspace
- approval detail depth
- timeline filtering + synthetic live events
- command surface with staged command actions
- first terminal/session scaffold with visible output

## What this alpha proves
1. The product can be modeled around **projects, tasks, runs, approvals, artifacts, events, commands, and terminal sessions**.
2. The UI can be structured around a **Project Workspace** instead of chat bubbles.
3. The visual language can carry a sci-fi tone without becoming unreadable.
4. Runtime actions can already affect timeline, approval state, command staging, and terminal output in one connected flow.

## Next implementation block
1. Deepen terminal session interaction
2. Model session history / command history
3. Add SQLite-backed local persistence for sessions, commands, events, approvals
4. Then connect a real PTY path on top of that foundation

## Why this order
Because PTY without stable history/persistence becomes terminal theater. The product needs memory, auditability, and resumability before raw shell streaming becomes the centerpiece.
