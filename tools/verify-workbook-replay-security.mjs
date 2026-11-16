// tools/verify-workbook-replay-security.mjs
// URL replay must reject unknown/mismatched topic IDs, and topic chips must
// render untrusted labels as inert text. Read-only, no browser/network needed.
import fs from 'node:fs';
import vm from 'node:vm';

let failed = 0;
function check(label, pass) {
  console.log((pass ? 'PASS' : 'FAIL') + ' - ' + label);
  if (!pass) failed++;
}

const body = fs.readFileSync('generator/workbook/controls.js', 'utf8');
function element(name = '') {
  return {
    name, value: '', className: '', textContent: '', innerHTML: '', hidden: false,
    selectedIndex: 0, children: [], options: [], dataset: {}, style: {}, attrs: {},
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    setAttribute(key, value) { this.attrs[key] = value; },
    querySelector() { return null; }
  };
}
async function scenario(hash) {
  const els = {};
  const get = name => els[name] || (els[name] = element(name));
  const listeners = {};
  let generated = 0;
  let clock = 0;
  const sandbox = {
    console, URLSearchParams,
    Date: { now: () => { clock += 5000; return clock; } },
    setTimeout: f => { if (f) f(); },
    document: {
      getElementById: get,
      createElement: element,
      addEventListener: (key, fn) => { listeners['document:' + key] = fn; }
    },
    location: { hash },
    history: { replaceState() {} },
    TargilimWorkbook: { rng: { isSeedCode: s => /^[2-9A-HJKMNP-Z]{6}$/.test(s || '') }, families: {} },
    TargilimEngine: { isEngineTopic: id => /-ENGINE$/.test(id) },
    TOPICS: {
      7: {
        geometry: [['G7-03-ENGINE', 'פיתגורס', 1]],
        numeric: [['N7-03-ENGINE', 'מספרים שליליים', 1]],
        algebra: [], uncertainty: []
      },
      8: { geometry: [], numeric: [], algebra: [], uncertainty: [] }
    },
    cleanTopicLabel: text => text,
    onGrade() {}, onDomain() {},
    generate() { generated++; },
    addEventListener(key, fn) { listeners[key] = fn; }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(body, sandbox, { filename: 'generator/workbook/controls.js' });
  listeners.load();
  await new Promise(resolve => setImmediate(resolve));
  return { sandbox, els, generated, W: sandbox.TargilimWorkbook };
}

const head = '#g=7&t=';
const tail = '&n=6&l=standard&p=uniform&d=worksheet&q=mixed&m=single&s=K7M2QF';

const valid = await scenario(head + 'G7-03-ENGINE,N7-03-ENGINE' + tail);
check('valid replay restores two trusted topic labels',
  valid.generated === 1 && valid.sandbox.__docTopics.length === 2 &&
  valid.sandbox.__docTopics[0].label === 'פיתגורס' &&
  valid.sandbox.__docTopics[1].label === 'מספרים שליליים');
check('valid chips are DOM elements, not injected HTML',
  valid.els.topicList?.innerHTML === '' &&
  valid.els.topicList?.children.length === 3);

const suspicious = '<img src=x onerror=alert(1)>';
valid.sandbox.__docTopics = [{ id: 'N7-03-ENGINE', label: suspicious }];
valid.W.controls.renderChips();
const chip = valid.els.topicList.children[1];
check('even a malicious label is inserted using textContent',
  chip?.children[0]?.textContent === suspicious &&
  valid.els.topicList.innerHTML === '');

const unknown = await scenario(head + 'N7-03-ENGINE,' + encodeURIComponent(suspicious) + tail);
check('unknown URL topic never generates or enters the topic list',
  unknown.generated === 0 && unknown.sandbox.__docTopics.length === 0);

const invalidGrade = await scenario('#g=9&t=N7-03-ENGINE' + tail);
check('unsupported grade is rejected before generating',
  invalidGrade.generated === 0 && invalidGrade.sandbox.__docTopics.length === 0);

const repeated = await scenario(head + 'N7-03-ENGINE,N7-03-ENGINE' + tail);
check('duplicate topic IDs are rejected',
  repeated.generated === 0 && repeated.sandbox.__docTopics.length === 0);

const wrongGrade = await scenario('#g=8&t=G7-03-ENGINE' + tail);
check('topic from a different grade is rejected',
  wrongGrade.generated === 0 && wrongGrade.sandbox.__docTopics.length === 0);

console.log(failed ? 'WORKBOOK_REPLAY_SECURITY_FAIL (' + failed + ')' : 'WORKBOOK_REPLAY_SECURITY_PASS');
process.exit(failed ? 1 : 0);
