# Aegis Bridge

A local-first, keyboard-first command center for agent workflows, terminal operations, and approval-aware control.

## Current alpha scope
- Monorepo structure with strict TypeScript across all packages
- Electron shell with sandbox enabled and context isolation
- Componentized React/Vite UI (AgentBoard, TimelinePanel, CommandSurface, TerminalSurface, ApprovalPanel)
- Runtime bridge with file-backed persistence and write-chain serialization
- Shared domain schema with mock snapshot fixture
- Design token package
- Cross-platform CI (Linux, Windows, macOS)
- Input validation and error handling on all bridge actions

## Workspace layout
- `apps/desktop` — Electron main/preload shell
- `apps/ui` — React/Vite UI workbench
  - `src/components/` — AgentBoard, ApprovalPanel, BridgeContext, CommandSurface, TerminalSurface, TimelinePanel
  - `src/hooks/` — useAlphaSnapshot
  - `src/lib/` — shared helpers and formatting utilities
- `packages/shared-schema` — core domain types, contracts, and mock snapshot fixture
- `packages/design-system` — tactical-minimal tokens
- `packages/client-sdk` — typed client bridge contract with browser-safe mock
- `packages/runtime-bridge` — local runtime/bridge with file-backed persistence
- `docs/` — alpha notes and roadmaps

## Scripts

```bash
npm install
npm run dev:ui          # start Vite dev server
npm run typecheck       # typecheck all workspaces
npm run test:runtime    # run runtime-bridge tests
npm run build:ui        # production UI build
npm run build           # full build (UI + desktop)
```

## CI / Release
- CI validates `typecheck`, runtime tests, and UI build on **Linux, Windows, and macOS**
- Release workflow publishes validated alpha artifacts on version tags (`v*.*.*`)
- Cross-platform desktop packaging (Linux, Windows, macOS) gates behind CI validation
- Desktop binaries are not production-ready yet; current release artifacts are staged alpha deliverables

## Alpha intent
This is not a finished product. It is the first implementation slice to prove:
- project workspace structure with componentized UI
- event-oriented domain model with persistence
- approval-aware UI with error handling and input validation
- disciplined sci-fi visual direction
- cross-platform build and test reliability
