# Beta Roadmap

## Goal
Move from the current alpha scaffold into a trustworthy local beta.

## Ordered delivery path
1. Finalize terminal session + command history model
2. Fix workspace typecheck baseline (`@types/react`, `@types/react-dom`, Node typings) ✅
3. Add SQLite-backed persistence for sessions, commands, events, approvals ✅ local file-backed persistence path in place as transition layer
4. Add integration tests around runtime/storage/state transitions ✅ initial runtime test baseline in place
5. Land the first real PTY path on top of the stable model
6. Harden one end-to-end beta flow

## Beta-critical test areas
- command staging updates session/history/event state correctly
- approval accept/reject remains auditable
- reload/restored state is not misleading
- timeline filtering remains consistent
- terminal surface distinguishes live output vs history vs approval context

## Rule
If a feature is hard to test, it is probably still too vague to trust in beta.
