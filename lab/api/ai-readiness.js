// Lab-only Vercel Function. Reports configuration state WITHOUT calling models.
// No auth tokens, secret values, budgets or user data are returned.
export function collectReadiness(env = {}) {
  return {
    schema: 'targilim-ai-lab-readiness/v1',
    project: 'targilim-ai-lab',
    gateway_auth: typeof env.VERCEL_OIDC_TOKEN === 'string' && env.VERCEL_OIDC_TOKEN.length > 0
      ? 'OIDC_TOKEN_PRESENT_NOT_VALIDATED'
      : 'OIDC_TOKEN_NOT_AVAILABLE',
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
  return res.status(200).json(collectReadiness(process.env));
}
