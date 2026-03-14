# GitHub and CI Roadmap

## Goals
- push the project to GitHub with a clean baseline -- done
- add CI for typecheck, runtime tests, and UI build -- done
- cross-platform CI (Linux, Windows, macOS) -- done
- prepare a staged release pipeline for desktop binaries -- done

## Delivery order
1. Repo hygiene pass before first push [done]
2. Add `.github/workflows/ci.yml` [done]
3. Keep CI green on `typecheck`, `test:runtime`, `build:ui` [done]
4. Add cross-platform matrix (ubuntu, windows, macos) to CI [done]
5. Add `.github/workflows/release.yml` for binary artifacts/releases [done]
6. Strengthen desktop packaging path (code signing, auto-update)
7. Pin GitHub Actions to SHA hashes for supply-chain safety before production releases

## Current CI matrix
| Platform | Status |
|----------|--------|
| ubuntu-latest | active |
| windows-latest | active |
| macos-latest | active |

## Rule
Do not celebrate binary generation before the desktop app is actually worth installing.
