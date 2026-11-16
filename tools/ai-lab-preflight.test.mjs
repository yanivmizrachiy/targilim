import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { inspect } from './ai-lab-preflight.mjs';

function fixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), 'targilim-ai-lab-'));
  const files = {
    'RULES.md': '# Authoritative rules\n',
    'PROJECT_STATUS.md': '# Status\n',
    'docs/SOURCE_BIBLE.md': '# Sources\n',
    'package.json': '{"scripts":{"verify:deep":"node verify.mjs"}}',
    '.github/workflows/gemini-agent.yml': 'name: Gemini agent\n',
    ...overrides,
  };
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

describe('AI Lab preflight — deterministic and fail-closed', () => {
  it('reports a valid baseline and never claims that providers ran', () => {
    const root = fixture();
    try {
      const report = inspect(root, 'abc123');
      assert.equal(report.baseline, 'PASS');
      assert.equal(report.checked_sha, 'abc123');
      assert.equal(report.mode, 'READ_ONLY_NO_MODEL_CALLS');
      assert.ok(Object.values(report.provider_status).every(value => value.endsWith('NOT_VERIFIED')));
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('flags the existing risky auto-commit without executing it', () => {
    const root = fixture({ '.github/workflows/gemini-agent.yml': 'uses: stefanzweifel/git-auto-commit-action@v5\n' });
    try {
      const report = inspect(root);
      assert.ok(report.findings.includes('LEGACY_WORKFLOW_AUTO_COMMIT_NEEDS_REVIEW'));
      assert.equal(report.baseline, 'PASS');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('fails if approved sources are missing', () => {
    const root = fixture({ 'docs/SOURCE_BIBLE.md': '' });
    try {
      const report = inspect(root);
      assert.equal(report.baseline, 'FAIL');
      assert.equal(report.checks.source_bible_present, false);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('fails on invalid package JSON or absent deep verification', () => {
    for (const content of ['INVALID JSON', '{"scripts":{}}']) {
      const root = fixture({ 'package.json': content });
      try {
        assert.equal(inspect(root).checks.deep_verifier_defined, false);
      } finally { rmSync(root, { recursive: true, force: true }); }
    }
  });
});
