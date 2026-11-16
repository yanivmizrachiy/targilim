/**
 * AI Lab approval: deterministic parser shared by ChatGPT→GitHub commands.
 * No models, no secrets, no network. Rejects anything not explicitly allowed.
 */
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNER = 'yanivmizrachiy';
const REPO = 'yanivmizrachiy/targilim';
const PROVIDERS = ['gemini', 'claude', 'codex'];

const deny = (reason) => ({ approved: false, provider: null, reason });

export function authorize(input) {
  if (input.repository !== REPO) return deny('wrong_repository');
  if (input.actor !== OWNER) return deny('not_owner');
  if (input.eventName === 'issue_comment') {
    if (String(input.issueNumber) !== '62') return deny('wrong_issue');
    const match = /^\/ai-lab smoke (gemini|claude|codex) I_APPROVE_ONE_CALL$/.exec(input.comment ?? '');
    if (!match) return deny('command_not_exact');
    return { approved: true, provider: match[1], reason: 'owner_exact_comment' };
  }
  if (input.eventName === 'workflow_dispatch') {
    if (input.ref !== 'refs/heads/main') return deny('not_default_branch');
    if (input.approval !== 'I_APPROVE_ONE_CALL') return deny('approval_missing');
    if (!PROVIDERS.includes(input.provider)) return deny('invalid_provider');
    return { approved: true, provider: input.provider, reason: 'owner_manual_dispatch' };
  }
  return deny('unsupported_event');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = authorize({
    repository: process.env.GITHUB_REPOSITORY,
    actor: process.env.GITHUB_ACTOR,
    eventName: process.env.GITHUB_EVENT_NAME,
    issueNumber: process.env.AI_LAB_ISSUE_NUMBER,
    comment: process.env.AI_LAB_COMMENT,
    provider: process.env.AI_LAB_PROVIDER,
    approval: process.env.AI_LAB_APPROVAL,
    ref: process.env.GITHUB_REF,
  });
  if (!result.approved) {
    process.stderr.write('BLOCKED: ' + result.reason + '; zero model calls\n');
    process.exitCode = 1;
  } else if (!process.env.GITHUB_OUTPUT) {
    process.stderr.write('BLOCKED: GITHUB_OUTPUT unavailable\n');
    process.exitCode = 1;
  } else {
    appendFileSync(process.env.GITHUB_OUTPUT, 'provider=' + result.provider + '\n');
    process.stdout.write('Approved one provider smoke: ' + result.provider + '\n');
  }
}
