# Security Policy

This project is early-stage alpha software.

## Reporting
If you find a security issue, report it privately to the maintainer instead of opening a public issue.

## Current security posture
- Electron sandbox enabled with context isolation and node integration disabled
- Vite dev server bound to localhost only (not exposed to network)
- Input validation on all bridge action methods (approval, rejection, command staging)
- Error messages do not leak internal state to the UI
- File-backed persistence uses atomic write (temp file + rename) to prevent corruption

## Scope notes
Current focus areas:
- local runtime/bridge boundaries
- approval flow honesty
- persistence and state restore behavior
- future PTY integration safety
- cross-platform behavior parity
