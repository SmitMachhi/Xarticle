# Agent Rules

1. Every code change must be committed immediately after verification, even if the change is small.
2. Commit messages must be lowercase, short(<6 words), vulgar and ironically funny.
3. Optimize for tokens: concise code, minimal repetition, no unnecessary abstractions.
4. Main edge function files stay lean and routing-only.
5. Max 200 lines per file (`max-lines` via ESLint).
6. Max 50 lines per function (`max-lines-per-function` via ESLint).
7. Max 150 lines per class (manual review requirement).
8. Cyclomatic complexity <= 10 and max nesting depth <= 3.
9. One responsibility per file.
10. DRY is absolute: avoid duplicate logic.
11. Keep a single source of truth and compute derived state.
12. Schema single-source: one TypeScript interface per entity.
13. Services stay pure; isolate side effects in dedicated functions.
14. No global side effects; only explicit entrypoints may perform startup effects.
15. Types are contracts: strict TypeScript, zero `any`.
16. Handle or await all async calls.
17. Extract repeated literals to constants.
18. Enforce feature boundaries; avoid cross-feature imports.
19. Prefer named exports for modules and shared utilities.
20. Lint standards:
    - `max-lines`: 200 per file
    - `max-lines-per-function`: 50
    - `complexity`: 10
    - `max-depth`: 3
    - `no-unused-vars`, `no-console`, `no-eval`
    - `no-magic-numbers` (except `-1`, `0`, `1`, `2`)
    - `prefer-const`, `no-var`
    - import organization: no cycles, consistent ordering
