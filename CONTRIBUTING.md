# Contributing to FitFluid

## Branch Strategy
- `main`: production-ready deployments.
- `develop`: integration branch for completed features.
- `feature/*`: new feature workstreams.
- `perf/*`: performance-focused changes.
- `hotfix/*`: critical fixes destined for production.
- `release/*`: stabilization before tagging.

## Commit Convention
```
type(scope): concise summary

- Bullet points wrapped at 72 chars
- Blank line between summary and body
- Reference issues when possible, e.g., Fixes #123
```

Accepted types: `feat`, `fix`, `perf`, `build`, `test`, `docs`, `refactor`,
`chore`.

## Required Checks (all PRs)
1. `npm run check` (TypeScript + type safety)
2. `npm run test` (Vitest suite)
3. `npm run analyze` (bundle analysis, fail on regressions)
4. `npx playwright test --project=mobile-safari` (mobile E2E)

## Pull Request Workflow
1. Branch off `develop` (or `main` for hotfixes).
2. Keep branches short-lived; rebase frequently.
3. Open a PR into `develop` with checklist of required checks.
4. After review + green CI, squash or merge per policy.
5. For releases, cut `release/x.y.z`, verify, then merge into both `main`
   and `develop` and tag (`git tag -a vX.Y.Z`).

## Performance Tracking
Document bundle sizes, LCP/regression notes, and notable perf wins in the
GitHub Release notes so stakeholders see the impact without digging through
the commit history.

## Critical Script Modifications

Automation scripts in the `scripts/` directory (for example
`scripts/component-rollback.ts`, `scripts/baseline-analyzer.ts`, CI helpers)
enforce safety guarantees across the regression-prevention system. Any change
to these files **must** include corresponding test updates in
`scripts/__tests__/`.

Pull requests touching these scripts are expected to:
- Update or add Vitest coverage demonstrating the new behavior
- Explain the safety impact in the PR description
- Keep dry-run defaults intact unless a reviewer signs off on a change

This policy prevents regressions in the rollback, baseline, and AI workflows.
