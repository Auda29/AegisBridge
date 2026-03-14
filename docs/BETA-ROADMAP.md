# Beta Roadmap

## Goal
Move from the current alpha scaffold into a trustworthy local beta.

## Ordered delivery path
1. Finalize terminal session + command history model
2. Fix workspace typecheck baseline (`@types/react`, `@types/react-dom`, Node typings) [done]
3. Add SQLite-backed persistence for sessions, commands, events, approvals [done] — local file-backed persistence path in place as transition layer
4. Add integration tests around runtime/storage/state transitions [done] — initial runtime test baseline in place
5. Extract shared mock data and eliminate cross-package duplication [done]
6. Componentize UI and add error handling / input validation [done]
7. Cross-platform CI (Linux, Windows, macOS) [done]
8. Land the first real PTY path on top of the stable model
9. Add client-sdk and UI component tests to reach 80%+ coverage
10. Harden one end-to-end beta flow

## Beta-critical test areas
- command staging updates session/history/event state correctly
- approval accept/reject remains auditable with proper error handling
- reload/restored state is not misleading
- timeline filtering remains consistent
- terminal surface distinguishes live output vs history vs approval context
- cross-platform behavior parity (Windows, macOS, Linux)

## Rule
If a feature is hard to test, it is probably still too vague to trust in beta.
