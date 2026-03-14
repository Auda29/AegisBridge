# GitHub and CI Roadmap

## Goals
- push the project to GitHub with a clean baseline
- add CI for typecheck, runtime tests, and UI build
- prepare a staged release pipeline for desktop binaries

## Delivery order
1. repo hygiene pass before first push
2. add `.github/workflows/ci.yml`
3. keep CI green on `typecheck`, `test:runtime`, `build:ui`
4. strengthen desktop packaging path
5. add `.github/workflows/release.yml` for binary artifacts/releases

## Rule
Do not celebrate binary generation before the desktop app is actually worth installing.
