// Lab-only Vercel Function. Read-only auth visibility, no provider calls.
// OIDC runtime tokens reach Vercel Functions in the x-vercel-oidc-token header,
// NOT necessarily process.env.VERCEL_OIDC_TOKEN (which is documented for builds).
// This endpoint never validates the header's signature and never claims it does.
function present(value) {
  return typeof value === 'string' && value.length > 0;
}

export function collectReadiness(env = {}, headers = {}) {
  const rawHeader = Object.entries(headers ?? {}).find(([key]) =>
    key.toLowerCase() === 'x-vercel-oidc-token'
  )?.[1];
  const oidcHeaderObserved = present(rawHeader);
  const gatewayKeyConfigured = present(env.AI_GATEWAY_API_KEY);
  const buildOidcConfigured = present(env.VERCEL_OIDC_TOKEN);

  return {
    schema: 'targilim-ai-lab-readiness/v1',
    project: 'targilim-ai-lab',
    gateway_auth: gatewayKeyConfigured
      ? 'GATEWAY_KEY_PRESENT_NOT_VALIDATED'
      : oidcHeaderObserved
        ? 'OIDC_HEADER_PRESENT_NOT_VALIDATED'
        : buildOidcConfigured
          ? 'OIDC_TOKEN_PRESENT_NOT_VALIDATED'
          : 'GATEWAY_AUTH_NOT_AVAILABLE',
    // An arbitrary request header is NOT proof of platform authentication.
    // Do not claim credentials, budget or usage until independently verified.
    gateway_account_verified: false,
    gateway_budget_verified: false,
    provider_auth_verified: { gemini: false, claude: false, codex: false },
    model_calls_authorized: false,
    model_calls_performed: 0,
    next_step: 'VERIFY_GATEWAY_ACCOUNT_AND_BUDGET_BEFORE_ONE_APPROVED_MODEL_CALL',
  };
}


// A single opt-in, non-generative authentication probe. No model requests,
// no balance value, no response body, no token value or remote error text exposed.
export async function checkGatewayCredits(token, fetchImpl = fetch) {
  if (!present(token)) return 'MISSING_AUTH';
  try {
    const response = await fetchImpl('https://ai-gateway.vercel.sh/v1/credits', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
      redirect: 'error',
      cache: 'no-store',
    });
    if (response.status === 200) {
      const type = response.headers?.get?.('content-type') || '';
      if (!type.includes('application/json')) return 'UNEXPECTED_RESPONSE';
      // Never materialize account balances or error text in output or logs.
      return 'AUTHENTICATED_CREDITS_ENDPOINT';
    }
    if (response.status === 401) return 'AUTH_REJECTED_401';
    if (response.status === 403) return 'AUTH_FORBIDDEN_403';
    if (response.status === 402) return 'CREDITS_OR_QUOTA_402';
    return 'UPSTREAM_HTTP_' + (Number.isInteger(response.status) ? response.status : 'UNKNOWN');
  } catch {
    return 'UPSTREAM_UNREACHABLE';
  }
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  const readiness = collectReadiness(process.env, req.headers ?? {});
  if (req.query?.verify === 'credits') {
    const h = Object.entries(req.headers ?? {}).find(([key]) =>
      key.toLowerCase() === 'x-vercel-oidc-token'
    )?.[1];
    const token = present(process.env.AI_GATEWAY_API_KEY)
      ? process.env.AI_GATEWAY_API_KEY
      : (present(h) ? h : process.env.VERCEL_OIDC_TOKEN);
    return checkGatewayCredits(token).then(status => {
      const verified = status === 'AUTHENTICATED_CREDITS_ENDPOINT';
      return res.status(200).json({
        ...readiness,
        gateway_account_verified: verified,
        gateway_probe_status: status,
        // A successful credits read does NOT verify a spend budget.
        gateway_budget_verified: false,
        model_calls_authorized: false,
        model_calls_performed: 0,
      });
    });
  }
  return res.status(200).json(readiness);
}
