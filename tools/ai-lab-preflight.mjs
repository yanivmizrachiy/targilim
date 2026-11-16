/**
 * TARGILIM AI LAB — read-only, deterministic repository readiness audit.
 * Never reads tokens, calls AI providers, or changes tracked files.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const items = Object.freeze({
  rules: 'RULES.md',
  status: 'PROJECT_STATUS.md',
  sourceBible: 'docs/SOURCE_BIBLE.md',
  package: 'package.json',
  legacyWorkflow: '.github/workflows/gemini-agent.yml',
});

function readText(root, filename) {
  const path = resolve(root, filename);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function inspect(root = defaultRoot, sha = 'UNSPECIFIED') {
  const files = Object.fromEntries(
    Object.entries(items).map(([name, file]) => [name, readText(root, file)])
  );
  let scripts = {};
  try {
    scripts = JSON.parse(files.package).scripts ?? {};
  } catch { /* Fail closed below. */ }
  const checks = {
    rules_present: files.rules.trim().length > 0,
    status_present: files.status.trim().length > 0,
    source_bible_present: files.sourceBible.trim().length > 0,
    deep_verifier_defined: typeof scripts['verify:deep'] === 'string' && scripts['verify:deep'].length > 0,
    legacy_workflow_present: files.legacyWorkflow.trim().length > 0,
  };
  const legacy = files.legacyWorkflow;
  const findings = [];
  if (legacy.includes('git-auto-commit-action')) {
    findings.push('LEGACY_WORKFLOW_AUTO_COMMIT_NEEDS_REVIEW');
  }
  if (legacy && !/(run-gemini-cli|claude-code-action|codex-action)@/.test(legacy)) {
    findings.push('LEGACY_WORKFLOW_NAME_NOT_PROOF_OF_MODEL_INTEGRATION');
  }
  const baselineOk = Object.values(checks).every(Boolean);
  return {
    schema: 'targilim-ai-lab-readiness/v1',
    repository: 'yanivmizrachiy/targilim',
    issue: 62,
    checked_sha: sha,
    mode: 'READ_ONLY_NO_MODEL_CALLS',
    baseline: baselineOk ? 'PASS' : 'FAIL',
    checks,
    findings,
    provider_status: {
      gemini: 'AUTH_AND_LIVE_RUN_NOT_VERIFIED',
      claude_code: 'AUTH_AND_LIVE_RUN_NOT_VERIFIED',
      codex: 'AUTH_AND_LIVE_RUN_NOT_VERIFIED',
    },
    next_gate: baselineOk ? 'OWNER_APPROVED_AUTH_SETUP_AND_PROVIDER_SMOKES' : 'REPAIR_BASELINE',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = inspect(defaultRoot, process.env.GITHUB_SHA ?? 'LOCAL');
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.baseline !== 'PASS') process.exitCode = 1;
}
