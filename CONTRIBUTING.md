# Contributing

## Current expectations
- keep changes scoped
- prefer small PRs
- do not break the runtime/typecheck/build baseline
- keep the project tactical-minimal and workflow-first

## Before opening a PR
Run:

```bash
npm install
npm run typecheck
npm run test:runtime
npm run build:ui
```

## Notes
The desktop packaging path is still evolving. Avoid pretending unfinished packaging is production-ready.
