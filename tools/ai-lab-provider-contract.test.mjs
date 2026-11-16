import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(join(root, '.github/workflows/ai-lab-provider-smoke.yml'), 'utf8');

test('no issue/PR-triggered provider execution', () => {
  assert.match(workflow, /workflow_dispatch:\s*\n/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' && github\.actor == 'yanivmizrachiy'/);
  assert.match(workflow, /needs: approve/g);
  assert.match(workflow, /if: needs\.approve\.outputs\.provider == 'gemini'/);
  assert.match(workflow, /if: needs\.approve\.outputs\.provider == 'claude'/);
  assert.match(workflow, /if: needs\.approve\.outputs\.provider == 'codex'/);
});

test('one paid call requires explicit consent and one choice', () => {
  assert.match(workflow, /I_APPROVE_ONE_CALL/);
  assert.match(workflow, /case "\$PROVIDER" in gemini\|claude\|codex/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /group: ai-lab-provider-smoke/);
});

test('all provider jobs are read-only at GitHub level', () => {
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write|issues: write|id-token: write/);
  assert.equal((workflow.match(/persist-credentials: false/g) ?? []).length, 4);
  assert.match(workflow, /permission-profile: ":read-only"/);
  assert.match(workflow, /--max-turns 2 --allowedTools Read,Glob,Grep/);
});

test('three official provider actions are wired but never called in the PR contract job', () => {
  assert.match(workflow, /uses: google-github-actions\/run-gemini-cli@v0/);
  assert.match(workflow, /uses: anthropics\/claude-code-action@v1/);
  assert.match(workflow, /uses: openai\/codex-action@v1/);
  assert.match(workflow, /node --test tools\/ai-lab-provider-contract\.test\.mjs/);
  assert.match(workflow, /secrets\.GEMINI_API_KEY/);
  assert.match(workflow, /secrets\.ANTHROPIC_API_KEY/);
  assert.match(workflow, /secrets\.CLAUDE_CODE_OAUTH_TOKEN/);
  assert.match(workflow, /secrets\.OPENAI_API_KEY/);
  assert.doesNotMatch(workflow, /(?:sk-proj-|sk-ant-)[A-Za-z0-9]/);
});
