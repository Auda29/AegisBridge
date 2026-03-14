# Contributing

## Current expectations
- keep changes scoped
- prefer small PRs
- do not break the runtime/typecheck/build baseline
- keep the project tactical-minimal and workflow-first
- ensure changes work cross-platform (Linux, Windows, macOS)

## Before opening a PR
Run:

```bash
npm install
npm run typecheck
npm run test:runtime
npm run build:ui
```

CI will run these checks on all three platforms automatically.

## Code organization
- UI components belong in `apps/ui/src/components/`
- Shared hooks in `apps/ui/src/hooks/`
- Utility functions in `apps/ui/src/lib/`
- Domain types and shared fixtures in `packages/shared-schema/`
- Keep files focused and under 400 lines where possible

## Notes
The desktop packaging path is still evolving. Avoid pretending unfinished packaging is production-ready.
