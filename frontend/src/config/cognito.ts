// Cognito configuration — values populated from .env (set after `cdk deploy`)

export const cognitoConfig = {
  region:       import.meta.env.VITE_COGNITO_REGION     ?? 'us-east-1',
  userPoolId:   import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
  clientId:     import.meta.env.VITE_COGNITO_CLIENT_ID  ?? '',
  // Hosted UI base URL: https://vocab-game-auth.auth.<region>.amazoncognito.com
  domain:       import.meta.env.VITE_COGNITO_DOMAIN     ?? '',
  appUrl:       import.meta.env.VITE_APP_URL            ?? 'http://localhost:5173',
  scopes:       ['openid', 'email', 'profile'],
} as const;

export const callbackUrl = `${cognitoConfig.appUrl}/callback`;
export const logoutUrl   = cognitoConfig.appUrl;

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function randomBase64Url(length: number): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(plain);
  const digest  = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function buildAuthUrl(provider: 'Google' | 'Facebook'): Promise<string> {
  const verifier  = randomBase64Url(64);
  const challenge = await sha256Base64Url(verifier);
  const state     = randomBase64Url(16);

  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('pkce_state',    state);

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             cognitoConfig.clientId,
    redirect_uri:          callbackUrl,
    scope:                 cognitoConfig.scopes.join(' '),
    state,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    identity_provider:     provider,
  });

  return `${cognitoConfig.domain}/oauth2/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type:    'authorization_code',
    client_id:     cognitoConfig.clientId,
    redirect_uri:  callbackUrl,
    code,
    code_verifier: verifier,
  });

  const res = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const tokens = await res.json() as TokenSet;
  sessionStorage.removeItem('pkce_verifier');
  sessionStorage.removeItem('pkce_state');
  return tokens;
}

export function buildLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id:  cognitoConfig.clientId,
    logout_uri: logoutUrl,
  });
  return `${cognitoConfig.domain}/logout?${params}`;
}

// ─── JWT decode (no validation — Cognito already validated) ──────────────────

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenSet {
  access_token:  string;
  id_token:      string;
  refresh_token: string;
  expires_in:    number;
  token_type:    string;
}

export interface CognitoUser {
  sub:      string;
  email:    string;
  name:     string;
  picture?: string;
}
