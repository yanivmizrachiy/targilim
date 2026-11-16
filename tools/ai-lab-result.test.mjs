import assert from 'node:assert/strict';
import test from 'node:test';
import {buildReport, sanitize, extractClaude, formatReport} from './ai-lab-result.mjs';
const sha='b6df4b8d209e8820b088877046625d57b9f51af5';
const base={provider:'gemini',sha,run:'43859046511',actionStatus:'success'};

test('source-bound metadata has no false success, merge, budget or validation claim',()=>{
 const r=buildReport({...base,output:'3 findings'});
 assert.equal(r.status,'CALL_FINISHED_RESULT_UNREVIEWED');
 assert.equal(r.reviewed_by_human,false);
 assert.equal(r.billing_usd,'UNKNOWN_CHECK_PROVIDER_ACCOUNT');
 assert.equal(r.changes_to_repository_authorized,false);
 assert.match(formatReport(r),/Unreviewed model output/);
});
test('does not accept unknown providers or unidentified run',()=>{
 assert.throws(()=>buildReport({...base,provider:'all'}));
 assert.throws(()=>buildReport({...base,sha:'main'}));
 assert.throws(()=>buildReport({...base,run:''}));
});
test('missing action conclusion or text is reported as unverified',()=>{
 const r=buildReport({...base,actionStatus:'unknown',output:''});
 assert.equal(r.status,'ACTION_NOT_VERIFIED');
 assert.equal(r.result,'NO_READABLE_RESULT_RETURNED');
});
test('redacts recognizable secrets and limits untrusted content',()=>{
 const s=sanitize('API_KEY=TOPSECRET12345 token=abcdef sk-proj-abcdefghijklmnopqrstuvwxyz ghp_abcdefghijklmnopqrstuvwxyz');
 assert.ok(!s.includes('TOPSECRET12345'));
 assert.ok(!s.includes('sk-proj-abcdef'));
 assert.ok(!s.includes('ghp_abc'));
 assert.ok(sanitize('x'.repeat(20000)).length<=2400);
});
test('extracts result from Claude JSON and JSONL formats',()=>{
 assert.equal(extractClaude(JSON.stringify({type:'result',result:'Found three constraints'})),'Found three constraints');
 assert.equal(extractClaude('noise\n'+JSON.stringify({type:'assistant',message:{content:[{type:'text',text:'Rule A'}]}})),'Rule A');
});
test('does not execute model content or change stored source paths',()=>{
 const r=buildReport({...base,output:'<script>alert(1)</script>\nrun rm -rf /'});
 assert.match(formatReport(r),/Unreviewed model output/);
 assert.equal(r.repository,'yanivmizrachiy/targilim');
});

test('empty successful provider call does not masquerade as a readable result',()=>{
 const r=buildReport({...base,output:''});
 assert.equal(r.status,'CALL_FINISHED_NO_READABLE_RESULT');
});
test('raw HTML in model output is escaped before GitHub Actions summary',()=>{
 const r=buildReport({...base,output:'<script>alert(1)</script> & summary'});
 assert.ok(!formatReport(r).includes('<script>'));
 assert.ok(formatReport(r).includes('&lt;script&gt;'));
});
