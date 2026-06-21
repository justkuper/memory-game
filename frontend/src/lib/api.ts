/**
 * API client — wraps calls to your Lambda / API Gateway once deployed.
 *
 * Until you add API Gateway + Lambda to the CDK stack:
 *   - reads fall back to sensible defaults
 *   - writes log to console (so the UI still works end-to-end)
 *
 * Set VITE_API_URL in .env to point at your deployed endpoint.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function authHeaders(accessToken: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface UserProgress {
  userId:       string;
  displayName:  string;
  wordsLearned: number;
  streak:       number;
  streakWeek:   string;   // "2024-W23" — used as GSI partition key
  totalScore:   number;
  lastPlayed:   string;   // ISO date
}

export async function getProgress(userId: string, accessToken: string): Promise<UserProgress | null> {
  if (!API_BASE) {
    // No API yet — return mock data so the UI renders
    return {
      userId,
      displayName:  'You',
      wordsLearned: 0,
      streak:       0,
      streakWeek:   currentWeekKey(),
      totalScore:   0,
      lastPlayed:   new Date().toISOString(),
    };
  }

  const res = await fetch(`${API_BASE}/progress/${userId}`, {
    headers: authHeaders(accessToken),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /progress failed: ${res.status}`);
  return res.json() as Promise<UserProgress>;
}

export async function saveProgress(
  progress: Partial<UserProgress> & { userId: string },
  accessToken: string
): Promise<void> {
  if (!API_BASE) {
    console.log('[api] saveProgress (no API yet):', progress);
    return;
  }
  const res = await fetch(`${API_BASE}/progress/${progress.userId}`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify(progress),
  });
  if (!res.ok) throw new Error(`PUT /progress failed: ${res.status}`);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface UserSettings {
  userId:    string;
  level:     'beginner' | 'intermediate' | 'advanced';
  dailyGoal: number;    // words per day
  theme:     'dark' | 'light';
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'userId'> = {
  level:     'beginner',
  dailyGoal: 10,
  theme:     'dark',
};

export async function getSettings(userId: string, accessToken: string): Promise<UserSettings> {
  if (!API_BASE) {
    const stored = localStorage.getItem(`settings_${userId}`);
    return stored
      ? (JSON.parse(stored) as UserSettings)
      : { userId, ...DEFAULT_SETTINGS };
  }

  const res = await fetch(`${API_BASE}/settings/${userId}`, {
    headers: authHeaders(accessToken),
  });
  if (res.status === 404) return { userId, ...DEFAULT_SETTINGS };
  if (!res.ok) throw new Error(`GET /settings failed: ${res.status}`);
  return res.json() as Promise<UserSettings>;
}

export async function saveSettings(
  settings: UserSettings,
  accessToken: string
): Promise<void> {
  if (!API_BASE) {
    localStorage.setItem(`settings_${settings.userId}`, JSON.stringify(settings));
    return;
  }
  const res = await fetch(`${API_BASE}/settings/${settings.userId}`, {
    method: 'PUT',
    headers: authHeaders(accessToken),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`PUT /settings failed: ${res.status}`);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId:       string;
  displayName:  string;
  streak:       number;
  wordsLearned: number;
  rank:         number;
}

export async function getLeaderboard(accessToken: string): Promise<LeaderboardEntry[]> {
  if (!API_BASE) {
    // Mock entries for development
    return [
      { userId: 'u1', displayName: 'Sofia M.',   streak: 21, wordsLearned: 342, rank: 1 },
      { userId: 'u2', displayName: 'Carlos R.',  streak: 14, wordsLearned: 210, rank: 2 },
      { userId: 'u3', displayName: 'Emma T.',    streak: 9,  wordsLearned: 158, rank: 3 },
      { userId: 'u4', displayName: 'James K.',   streak: 7,  wordsLearned: 95,  rank: 4 },
      { userId: 'u5', displayName: 'Ana P.',     streak: 5,  wordsLearned: 63,  rank: 5 },
    ];
  }

  const week = currentWeekKey();
  const res  = await fetch(`${API_BASE}/leaderboard?week=${week}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`GET /leaderboard failed: ${res.status}`);
  return res.json() as Promise<LeaderboardEntry[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentWeekKey(): string {
  const now  = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
