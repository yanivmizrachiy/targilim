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
test('runtime OIDC request header is detected as observed but never verified', () => {
  const secret='very-sensitive-runtime-oidc-header';
  const r=collectReadiness({}, {'x-vercel-oidc-token':secret});
  assert.equal(r.gateway_auth,'OIDC_HEADER_PRESENT_NOT_VALIDATED');
  assert.equal(r.gateway_account_verified,false);
  assert.equal(r.gateway_budget_verified,false);
  assert.equal(r.model_calls_authorized,false);
  assert.ok(!JSON.stringify(r).includes(secret));
});
test('runtime OIDC header matching is case-insensitive', () => {
  assert.equal(collectReadiness({}, {'X-Vercel-Oidc-Token':'opaque'}).gateway_auth,
    'OIDC_HEADER_PRESENT_NOT_VALIDATED');
});
test('empty runtime OIDC header does not fake identity', () => {
  assert.equal(collectReadiness({}, {'x-vercel-oidc-token':''}).gateway_auth,
    'GATEWAY_AUTH_NOT_AVAILABLE');
});
test('API key presence takes priority without exposing key or OIDC header', () => {
  const r=collectReadiness({AI_GATEWAY_API_KEY:'secret-key'}, {'x-vercel-oidc-token':'secret-token'});
  assert.equal(r.gateway_auth,'GATEWAY_KEY_PRESENT_NOT_VALIDATED');
  assert.equal(r.gateway_account_verified,false);
  assert.ok(!JSON.stringify(r).includes('secret-key'));
  assert.ok(!JSON.stringify(r).includes('secret-token'));
});
test('HTTP handler passes incoming OIDC header without returning its value', () => {
  const state={code:0,body:null,headers:{}};
  const response={
    setHeader(k,v){state.headers[k]=v;return this;},
    status(c){state.code=c;return this;},
    json(b){state.body=b;return this;},
  };
  handler({method:'GET',headers:{'x-vercel-oidc-token':'a-realistic-secret-token'}},response);
  assert.equal(state.code,200);
  assert.equal(state.body.gateway_auth,'OIDC_HEADER_PRESENT_NOT_VALIDATED');
  assert.ok(!JSON.stringify(state.body).includes('a-realistic-secret-token'));
  assert.equal(state.headers['Cache-Control'],'no-store');
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
