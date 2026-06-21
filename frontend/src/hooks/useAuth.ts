import { useState, useEffect, useCallback } from 'react';
import {
  buildAuthUrl,
  buildLogoutUrl,
  decodeJwtPayload,
  type CognitoUser,
  type TokenSet,
} from '@/config/cognito';

const TOKEN_KEY = 'vocab_game_tokens';

function loadTokens(): TokenSet | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as TokenSet) : null;
  } catch {
    return null;
  }
}

function saveTokens(tokens: TokenSet) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function clearTokens() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function tokensToUser(tokens: TokenSet): CognitoUser {
  const payload = decodeJwtPayload(tokens.id_token);
  return {
    sub:     String(payload['sub']     ?? ''),
    email:   String(payload['email']   ?? ''),
    name:    String(payload['name'] ?? payload['cognito:username'] ?? ''),
    picture: payload['picture'] ? String(payload['picture']) : undefined,
  };
}

export interface AuthState {
  user:    CognitoUser | null;
  tokens:  TokenSet    | null;
  loading: boolean;
  signIn:  (provider: 'Google' | 'Facebook') => Promise<void>;
  signOut: () => void;
  setSession: (tokens: TokenSet) => void;
}

export function useAuth(): AuthState {
  const [tokens,  setTokens]  = useState<TokenSet | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const stored = loadTokens();
    if (stored) setTokens(stored);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (provider: 'Google' | 'Facebook') => {
    const url = await buildAuthUrl(provider);
    window.location.href = url;
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setTokens(null);
    window.location.href = buildLogoutUrl();
  }, []);

  const setSession = useCallback((newTokens: TokenSet) => {
    saveTokens(newTokens);
    setTokens(newTokens);
  }, []);

  return {
    user:    tokens ? tokensToUser(tokens) : null,
    tokens,
    loading,
    signIn,
    signOut,
    setSession,
  };
}
