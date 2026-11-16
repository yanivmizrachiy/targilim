/**
 * AI Lab: bounded, auditable provider result for the GPT control interface.
 * Model text is untrusted and never executed, treated as findings only.
 */
import { readFileSync, appendFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROVIDERS = new Set(['gemini','claude','codex']);
const MAX_TEXT = 2400;
const MAX_FILE_BYTES = 2000000;

export function sanitize(value) {
  return String(value ?? '')
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\b(?:sk-proj-|sk-ant-|gh[pousr]_|github_pat_|AIza)[A-Za-z0-9_-]{7,}/g, '[REDACTED_POSSIBLE_KEY]')
    .replace(/((?:api[_-]?key|access[_-]?token|authorization)\s*[:=]\s*)(?:Bearer\s+)?[^\s"'<>]+/gi, '$1[REDACTED]')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, MAX_TEXT);
}

export function extractClaude(content) {
  const raw = String(content ?? '').slice(0, MAX_FILE_BYTES);
  const parsed = [];
  try { parsed.push(JSON.parse(raw)); } catch { /* common JSONL format */ }
  for (const line of raw.split('\n').slice(-300)) {
    if (line.length > 100000) continue;
    try { parsed.push(JSON.parse(line)); } catch { /* non-JSON line */ }
  }
  for (const row of parsed.reverse()) {
    if (typeof row?.result === 'string' && row.result) return row.result;
    if (row?.type === 'assistant' && Array.isArray(row.message?.content)) {
      const text = row.message.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      if (text) return text;
    }
  }
  return '';
}

export function buildReport(input) {
  const provider = String(input.provider ?? '');
  if (!PROVIDERS.has(provider)) throw new Error('provider is not allowlisted');
  const sha = String(input.sha ?? '');
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('commit SHA missing');
  const run = String(input.run ?? '');
  if (!/^[1-9][0-9]{0,16}$/.test(run)) throw new Error('run ID missing');
  const rawText = sanitize(input.output);
  const status = input.actionStatus === 'success'
    ? (rawText ? 'CALL_FINISHED_RESULT_UNREVIEWED' : 'CALL_FINISHED_NO_READABLE_RESULT')
    : 'ACTION_NOT_VERIFIED';
  return {
    schema: 'targilim-ai-lab-smoke-result/v1',
    repository: 'yanivmizrachiy/targilim',
    issue: 62,
    provider, sha, run,
    status, result: rawText || 'NO_READABLE_RESULT_RETURNED',
    reviewed_by_human: false,
    changes_to_repository_authorized: false,
    billing_usd: 'UNKNOWN_CHECK_PROVIDER_ACCOUNT',
  };
}

export function formatReport(r) {
  const safeResult = r.result.replace(/^\s*>/gm, ' >');
  return [
    '# TARGILIM AI LAB — single-provider result',
    '',
    '- Provider: ' + r.provider,
    '- Status: ' + r.status,
    '- SHA: ' + r.sha,
    '- Run: ' + r.run,
    '- Human validation: NOT DONE',
    '- Billing: UNKNOWN — verify provider console',
    '- No repo writes, merge or deploy authorized',
    '',
    '## Unreviewed model output (informational only)',
    ...safeResult.split('\n').map(line => '> ' + line),
    '',
  ].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let output = process.env.AI_LAB_MODEL_OUTPUT ?? '';
  if (process.env.AI_LAB_PROVIDER === 'claude' && !output && process.env.AI_LAB_CLAUDE_FILE) {
    try {
      const path = process.env.AI_LAB_CLAUDE_FILE;
      if (existsSync(path) && statSync(path).size <= MAX_FILE_BYTES) {
        output = extractClaude(readFileSync(path, 'utf8'));
      }
    } catch { /* report the missing output honestly */ }
  }
  const r = buildReport({
    provider: process.env.AI_LAB_PROVIDER,
    sha: process.env.GITHUB_SHA,
    run: process.env.GITHUB_RUN_ID,
    output,
    actionStatus: process.env.AI_LAB_ACTION_STATUS,
  });
  const text = formatReport(r);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
  process.stdout.write('AI_LAB_REPORT_START\n' + text + 'AI_LAB_REPORT_END\n');
}
