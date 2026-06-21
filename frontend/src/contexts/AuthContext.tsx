import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
  userId:   string;
  email:    string;
  name:     string;
  avatar:   string | null;
  provider: 'google' | 'facebook' | 'email';
}

interface AuthContextValue {
  user:             AppUser | null;
  loading:          boolean;
  signInWithGoogle: (profile: GoogleProfile) => Promise<void>;
  signInWithFacebook: (profile: FacebookProfile) => Promise<void>;
  signOut:          () => void;
}

export interface GoogleProfile {
  sub:     string;
  email:   string;
  name:    string;
  picture: string;
}

export interface FacebookProfile {
  sub:     string;
  email:   string;
  name:    string;
  picture: string | null;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const SESSION_KEY = 'vocab-game-session';

function loadSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AppUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = loadSession();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const signInWithGoogle = async (profile: GoogleProfile) => {
    const u: AppUser = {
      userId:   profile.sub,
      email:    profile.email,
      name:     profile.name,
      avatar:   profile.picture,
      provider: 'google',
    };
    setUser(u);
    saveSession(u);
  };

  const signInWithFacebook = async (profile: FacebookProfile) => {
    const u: AppUser = {
      userId:   profile.sub,
      email:    profile.email,
      name:     profile.name,
      avatar:   profile.picture,
      provider: 'facebook',
    };
    setUser(u);
    saveSession(u);
  };

  const signOut = () => {
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithFacebook, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
