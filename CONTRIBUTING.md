# Contributing to Targilim

Targilim is a Hebrew RTL math exercise generator for Grades 7–8. Contributions are welcome when they improve correctness, accessibility, documentation, testing, or contributor experience without weakening the repository's verification rules.

## Before you start

1. Read `RULES.md` and `README.md`.
2. Pick an existing issue when possible. For a new idea, open an issue first so scope and source requirements are clear.
3. Do not add invented mathematical content. New exercise content must be source-backed as required by `RULES.md`.
4. Keep student-facing Hebrew and math rendering correct in RTL/BiDi contexts.

## Local setup

```bash
npm install
npm run verify:sync
npm run verify:workbench
npm run verify:deep
```

If a command is unavailable or changes in the future, follow the current `package.json` and `README.md` as the canonical command sources.

## Good first contributions

Suitable first contributions include:

- documentation fixes and clearer contributor instructions;
- accessibility improvements that preserve existing behavior;
- tests for existing source-backed behavior;
- small RTL/BiDi robustness fixes;
- reproducible bug reports with a minimal test case;
- improvements to developer tooling that keep verification deterministic.

## Pull requests

Keep each PR focused. Explain:

- what problem it solves;
- which files or behavior it changes;
- how you verified the change;
- whether student-facing output changes;
- which source backs any mathematical-content change.

Before requesting review, run the strongest relevant checks. Every PR must continue to satisfy the repository's required verification gates.

## Contributor safety

Do not include student data, private credentials, API keys, personal information, or copyrighted source material that the repository is not allowed to redistribute.

## Recognition

External contributions are credited through GitHub's commit and pull-request history. High-quality repeat contributors may be invited to help triage issues or review narrowly scoped changes.
