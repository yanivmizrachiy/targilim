import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = readFileSync(join(root, '.github/workflows/ai-lab-provider-smoke.yml'), 'utf8');

test('no unapproved issue/PR-triggered provider execution', () => {
  assert.match(workflow, /workflow_dispatch:\s*\n/);
  assert.match(workflow, /github\.actor == 'yanivmizrachiy'/);
  assert.match(workflow, /github\.event\.issue\.number == 62/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /github\.event_name == 'issue_comment'/);
  assert.match(workflow, /run: node tools\/ai-lab-commands\.mjs/);
  assert.match(workflow, /github\.event\.issue\.number == 62/);
  assert.match(workflow, /startsWith\(github\.event\.comment\.body, '\/ai-lab smoke '\)/);
  assert.match(workflow, /needs: approve/g);
  assert.match(workflow, /if: needs\.approve\.outputs\.provider == 'gemini'/);
  assert.match(workflow, /if: needs\.approve\.outputs\.provider == 'claude'/);
  assert.match(workflow, /if: needs\.approve\.outputs\.provider == 'codex'/);
});

test('one paid call requires explicit consent and one choice', () => {
  assert.match(workflow, /I_APPROVE_ONE_CALL/);
  assert.match(workflow, /run: node tools\/ai-lab-commands\.mjs/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /group: ai-lab-provider-smoke/);
});

test('all provider jobs are read-only at GitHub level', () => {
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write|issues: write|id-token: write/);
  assert.equal((workflow.match(/persist-credentials: false/g) ?? []).length, 5);
  assert.match(workflow, /permission-profile: ":read-only"/);
  assert.match(workflow, /--max-turns 2 --max-budget-usd 0\.50 --allowedTools Read,Glob,Grep/);
  assert.ok(workflow.includes('"core":["read_file","read_many_files","list_directory","glob","grep_search"]'));
  assert.ok(workflow.includes('"maxSessionTurns":4'));
  assert.ok(workflow.includes('"overageStrategy":"never"'));
});

test('three official provider actions are wired but never called in the PR contract job', () => {
  assert.match(workflow, /uses: google-github-actions\/run-gemini-cli@v0/);
  assert.match(workflow, /uses: anthropics\/claude-code-action@v1/);
  assert.match(workflow, /uses: openai\/codex-action@v1/);
  assert.match(workflow, /node --test tools\/ai-lab-provider-contract\.test\.mjs tools\/ai-lab-commands\.test\.mjs/);
  assert.match(workflow, /secrets\.GEMINI_API_KEY/);
  assert.match(workflow, /secrets\.ANTHROPIC_API_KEY/);
  assert.match(workflow, /secrets\.CLAUDE_CODE_OAUTH_TOKEN/);
  assert.match(workflow, /secrets\.OPENAI_API_KEY/);
  assert.doesNotMatch(workflow, /(?:sk-proj-|sk-ant-)[A-Za-z0-9]/);
});

test('legacy false Gemini/OpenAI workflow is inert and cannot auto-commit', () => {
  const old = readFileSync(join(root, '.github/workflows/gemini-agent.yml'), 'utf8');
  assert.match(old, /workflow_dispatch:/);
  assert.match(old, /permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(old, /issue_comment:|\bissues:\s*\n|git-auto-commit-action|contents: write/);
  assert.doesNotMatch(old, /uses:\s+(?:google-github-actions\/run-gemini-cli|anthropics\/claude-code-action|openai\/codex-action)/);
  assert.match(old, /intentionally inert/);
});
