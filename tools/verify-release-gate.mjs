// tools/verify-release-gate.mjs
// Keep the production Pages workflow fail-closed: only the account owner may
// manually release the exact current main SHA after a successful deep CI run.
// This is a static contract test; the workflow itself enforces at runtime.
import fs from 'node:fs';

let failures = 0;
function check(name, ok) {
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name);
  if (!ok) failures++;
}
const yaml = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
const head = yaml.split(/^permissions:/m)[0];
const ownerGuard = yaml.split(/^jobs:/m)[1] || '';

check('deploy workflow can be manually dispatched', /^\s{2}workflow_dispatch:/m.test(head));
check('push no longer deploys automatically', !/^\s{2}push:/m.test(head));
check('deploy job requires main branch', ownerGuard.includes("github.ref == 'refs/heads/main'"));
check('deploy job requires owner initiation', ownerGuard.includes("github.actor == 'yanivmizrachiy'"));
check('reruns must also be owner initiated', ownerGuard.includes("github.triggering_actor == 'yanivmizrachiy'"));
check('workflow can read GitHub Actions history', /^\s{2}actions: read$/m.test(yaml));
check('workflow checks out main explicitly', /uses: actions\/checkout@v4\s+with:\s+ref: main/.test(yaml));
check('exact main commit is verified before publishing',
  yaml.includes('git rev-parse HEAD') &&
  yaml.includes('git ls-remote origin refs/heads/main') &&
  yaml.includes('head_sha='));
check('deep verification must have succeeded on a push to main',
  yaml.includes('Verify Targilim Deep') &&
  yaml.includes('.event == "push"') &&
  yaml.includes('.conclusion == "success"') &&
  yaml.includes('.head_sha == $sha'));
check('release refuses stale main after preparing the PDFs',
  yaml.includes('Refuse publication if main advanced during bundle preparation'));
check('source PDFs remain part of the published artifact',
  yaml.includes('generator/assets/sources') && yaml.includes('-eq 10'));
check('pages deployment remains present', yaml.includes('actions/deploy-pages@v4'));

console.log(failures ? 'RELEASE_GATE_FAIL (' + failures + ')' : 'RELEASE_GATE_PASS');
process.exit(failures ? 1 : 0);
