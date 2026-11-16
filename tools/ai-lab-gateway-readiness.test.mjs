import assert from 'node:assert/strict';
import test from 'node:test';
import handler, {collectReadiness, checkGatewayCredits} from '../lab/api/ai-readiness.js';

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


test('read-only credits check uses one authenticated GET and returns no balance', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({url, options});
    return {
      status: 200,
      headers: {get: () => 'application/json; charset=utf-8'},
      json: async () => ({balance:'SENSITIVE_BALANCE', lifetime_spend:'SENSITIVE_SPEND'}),
    };
  };
  const result = await checkGatewayCredits('PRIVATE_TOKEN_VALUE', fakeFetch);
  assert.equal(result, 'AUTHENTICATED_CREDITS_ENDPOINT');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://ai-gateway.vercel.sh/v1/credits');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer PRIVATE_TOKEN_VALUE');
  assert.ok(!result.includes('PRIVATE_TOKEN_VALUE'));
  assert.ok(!result.includes('SENSITIVE_BALANCE'));
});

test('credits check fails closed on absence and rejection of auth', async () => {
  let calls = 0;
  const unused = async () => { calls++; throw Error('SHOULD_NOT_BE_CALLED'); };
  assert.equal(await checkGatewayCredits('', unused), 'MISSING_AUTH');
  assert.equal(calls, 0);
  for (const [code, expected] of [[401,'AUTH_REJECTED_401'],[403,'AUTH_FORBIDDEN_403'],[402,'CREDITS_OR_QUOTA_402']]) {
    const fake = async () => ({status:code, headers:{get:()=> 'application/json'}});
    assert.equal(await checkGatewayCredits('token', fake), expected);
  }
});

test('credits check never returns remote response payload, upstream exception or untrusted HTML', async () => {
  const badText = 'SENSITIVE_UPSTREAM_SECRET';
  const fakeFetch = async () => ({status:200, headers:{get:()=> 'text/html'}, text:async()=>badText});
  assert.equal(await checkGatewayCredits('token', fakeFetch), 'UNEXPECTED_RESPONSE');
  const throws = async () => {throw new Error(badText);};
  assert.equal(await checkGatewayCredits('token', throws), 'UPSTREAM_UNREACHABLE');
});
