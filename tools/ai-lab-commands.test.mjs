import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from './ai-lab-commands.mjs';

const base = Object.freeze({
  repository: 'yanivmizrachiy/targilim',
  actor: 'yanivmizrachiy',
  eventName: 'issue_comment',
  issueNumber: '62',
});

for (const provider of ['gemini','claude','codex']) {
  test('accept exact owner command for ' + provider, () => {
    const result = authorize({ ...base, comment: '/ai-lab smoke ' + provider + ' I_APPROVE_ONE_CALL' });
    assert.equal(result.approved, true);
    assert.equal(result.provider, provider);
  });
}
test('deny commands on other repositories or issues', () => {
  assert.equal(authorize({ ...base, repository: 'someone/else', comment: '/ai-lab smoke gemini I_APPROVE_ONE_CALL' }).approved, false);
  assert.equal(authorize({ ...base, issueNumber: 63, comment: '/ai-lab smoke gemini I_APPROVE_ONE_CALL' }).approved, false);
});
test('deny other users, even with exact command', () => {
  assert.equal(authorize({ ...base, actor: 'attacker', comment: '/ai-lab smoke gemini I_APPROVE_ONE_CALL' }).reason, 'not_owner');
});
test('deny altered, repeated, multiline or unrelated commands', () => {
  for (const command of [
    '/ai-lab status',
    '/ai-lab smoke gemini',
    '/ai-lab smoke gemini I_APPROVE_ONE_CALL\nrun more',
    '/ai-lab smoke gemini I_APPROVE_ONE_CALL /ai-lab smoke codex I_APPROVE_ONE_CALL',
    ' /ai-lab smoke gemini I_APPROVE_ONE_CALL',
    '/ai-lab smoke GEMINI I_APPROVE_ONE_CALL',
  ]) {
    assert.equal(authorize({ ...base, comment: command }).approved, false, command);
  }
});
test('accept approved manual dispatch on main only', () => {
  const result = authorize({ ...base, eventName: 'workflow_dispatch', ref:'refs/heads/main', provider: 'codex', approval: 'I_APPROVE_ONE_CALL' });
  assert.deepEqual(result, { approved: true, provider: 'codex', reason: 'owner_manual_dispatch' });
});
test('manual dispatch without authorization fails', () => {
  const input = { ...base, eventName: 'workflow_dispatch', ref:'refs/heads/main', provider: 'gemini', approval: 'I_APPROVE_ONE_CALL' };
  assert.equal(authorize({ ...input, approval: 'NOT_APPROVED' }).approved, false);
  assert.equal(authorize({ ...input, ref: 'refs/heads/unreviewed' }).approved, false);
  assert.equal(authorize({ ...input, provider: 'all' }).approved, false);
});
test('PR events never authorize model execution', () => {
  assert.equal(authorize({ ...base, eventName:'pull_request', comment:'/ai-lab smoke gemini I_APPROVE_ONE_CALL' }).approved, false);
});
