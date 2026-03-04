# Agent Rules (Stack Agnostic)

1. Every code change must be committed immediately after verification, even if the change is small.
2. Commit messages must be lowercase, short (<6 words), vulgar, and ironically funny.
3. Optimize for tokens: concise code, no redundant abstractions, no duplicate logic.
4. Entrypoints are orchestration-only: no hidden global side effects outside explicit startup/entry files.
5. One responsibility per file/module; enforce clear boundaries between features/layers.
6. DRY + single source of truth: derive state/data; avoid duplicated constants, rules, and transformations.
7. Types are contracts:
   - Typed languages: strict mode on; no escape hatches (`any`, unchecked casts, etc.).
   - Dynamic languages: enforce schemas/contracts at boundaries and static checks where available.
8. Core/domain services stay pure; side effects live in dedicated adapter/infrastructure functions.
9. Extract repeated literals/config to named constants; prefer named exports/public symbols for shared modules.
10. Quality gates are mandatory and must be enforced by repo tooling (language-appropriate linters/analyzers):
    - file length <= 200 lines (excluding blanks/comments where supported)
    - function length <= 50 lines
    - class length <= 150 lines (manual if tool lacks rule)
    - cyclomatic complexity <= 10
    - nesting depth <= 3
    - no unused vars/symbols
    - no debug logging in production paths
    - no dynamic code execution (`eval`-style)
    - no magic numbers except {-1, 0, 1, 2} unless named constant
    - immutable defaults (`prefer-const` equivalent)
    - no mutable legacy declarations (`var` equivalent)
    - no module/import cycles
    - deterministic sorted imports/includes/usings
11. Security and reliability baseline:
    - validate and sanitize all external input at trust boundaries
    - fail closed on parsing/validation errors
    - explicit timeouts/retries/backoff for network/IO
    - no secrets in code, logs, fixtures, or commit history
12. Verification before commit must include all relevant checks for the stack (lint/static analysis, tests, and build/type checks where applicable).
