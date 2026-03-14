# Aegis Bridge

A local-first, keyboard-first command center for agent workflows, terminal operations, and approval-aware control.

## Current alpha scope
- Monorepo structure in place
- Electron shell scaffold
- UI app scaffold with alpha mock workspace
- Runtime bridge scaffold
- Shared domain schema package
- Design token package
- Alpha implementation notes and next steps

## Workspace layout
- `apps/desktop` — Electron main/preload shell
- `apps/ui` — React/Vite UI workbench
- `packages/shared-schema` — core domain types and contracts
- `packages/design-system` — tactical-minimal tokens
- `packages/client-sdk` — typed client bridge contract
- `packages/runtime-bridge` — local runtime/bridge scaffold
- `docs/` — alpha notes

## Scripts

```bash
npm install
npm run dev:ui
npm run typecheck
npm run test:runtime
npm run build:ui
```

## CI / Release
- CI validates `typecheck`, runtime tests, and UI build on pushes/PRs
- Release workflow publishes validated alpha artifacts on version tags
- Desktop binaries are not packaged yet; current release artifacts are staged alpha deliverables, not finished installers

## Alpha intent
This is not a finished product. It is the first implementation slice to prove:
- project workspace structure
- event-oriented domain model
- approval-aware UI concepts
- disciplined sci-fi visual direction
