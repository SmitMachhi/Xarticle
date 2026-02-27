# Agent Rules

1. Every code change must be committed immediately after verification, even if the change is small.
2. Commit messages must be lowercase, short(<6 words), vulgar and ironically funny.
3. Optimize for tokens: concise, no duplicate/redundant abstractions.
4. Entry edge files are routing-only; no global side effects outside explicit entrypoints.
5. One responsibility per file; enforce feature boundaries (no cross-feature imports).
6. DRY + single source of truth: no duplicated logic; derive state.
7. Types are contracts: strict TypeScript, no `any`, one interface per entity.
8. Services stay pure; side effects only in dedicated functions.
9. Extract repeated literals to constants; prefer named exports for shared modules.
10. Lint gates: `max-lines` 200/file, `max-lines-per-function` 50, class <=150 (manual), complexity <=10, depth <=3, `no-unused-vars`, `no-console`, `no-eval`, `no-magic-numbers` except `-1,0,1,2`, `prefer-const`, `no-var`, no import cycles, sorted imports.
