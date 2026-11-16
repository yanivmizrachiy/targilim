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

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  return res.status(200).json(collectReadiness(process.env, req.headers ?? {}));
}
