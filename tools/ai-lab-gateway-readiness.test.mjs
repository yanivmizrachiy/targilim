import assert from 'node:assert/strict';
import test from 'node:test';
import handler, {collectReadiness} from '../lab/api/ai-readiness.js';

test('gateway probe never prints or returns an OIDC token', () => {
  const opaque = 'private-oidc-token-for-a-unit-test';
  const result = collectReadiness({VERCEL_OIDC_TOKEN: opaque});
  const json = JSON.stringify(result);
  assert.equal(result.gateway_auth, 'OIDC_TOKEN_PRESENT_NOT_VALIDATED');
  assert.ok(!json.includes(opaque));
  assert.equal(result.gateway_account_verified, false);
  assert.equal(result.gateway_budget_verified, false);
  assert.equal(result.model_calls_authorized, false);
  assert.equal(result.model_calls_performed, 0);
  assert.deepEqual(result.provider_auth_verified, {gemini:false,claude:false,codex:false});
});
test('no credentials is reported as unavailable, not success', () => {
  assert.equal(collectReadiness({}).gateway_auth, 'GATEWAY_AUTH_NOT_AVAILABLE');
});
test('AI Gateway key is detected only by presence and never returned', () => {
  const secret='key-test-never-leak';
  const result=collectReadiness({AI_GATEWAY_API_KEY:secret});
  assert.equal(result.gateway_auth,'GATEWAY_KEY_PRESENT_NOT_VALIDATED');
  assert.equal(result.gateway_budget_verified,false);
  assert.ok(!JSON.stringify(result).includes(secret));
});
test('GET returns no-store and no model action', () => {
  const prev=process.env.VERCEL_OIDC_TOKEN;
  delete process.env.VERCEL_OIDC_TOKEN;
  const state={headers:{},status:null,body:null};
  const response={
    setHeader(k,v){state.headers[k]=v;return this;},
    status(n){state.status=n;return this;},
    json(o){state.body=o;return this;},
  };
  try {
    handler({method:'GET'},response);
    assert.equal(state.status,200);
    assert.equal(state.headers['Cache-Control'],'no-store');
    assert.equal(state.body.model_calls_authorized,false);
  } finally {
    if(prev===undefined)delete process.env.VERCEL_OIDC_TOKEN;
    else process.env.VERCEL_OIDC_TOKEN=prev;
  }
});
test('unsafe HTTP methods are rejected', () => {
  const state={status:null,body:null};
  const res={setHeader(){return this;},status(n){state.status=n;return this;},json(o){state.body=o;return this;}};
  handler({method:'POST'},res);
  assert.equal(state.status,405);
  assert.equal(state.body.error,'METHOD_NOT_ALLOWED');
});
