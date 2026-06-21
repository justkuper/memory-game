import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api';
import styles from './Leaderboard.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user }                     = useAuth();
  const [entries, setEntries]        = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]        = useState(true);
  const [error,   setError]          = useState('');

  useEffect(() => {
    getLeaderboard('')
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏆 Weekly Leaderboard</h1>
        <p className={styles.sub}>Ranked by active streak this week</p>
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}
      {error   && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.list}>
          {entries.map((e, i) => (
            <div
              key={e.userId}
              className={`${styles.row} ${e.userId === user?.userId ? styles.you : ''}`}
            >
              <span className={styles.rank}>
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </span>
              <div className={styles.name}>
                {e.displayName}
                {e.userId === user?.userId && <span className={styles.badge}>You</span>}
              </div>
              <div className={styles.meta}>
                <span className={styles.pill}>🔥 {e.streak}d</span>
                <span className={styles.pill}>📚 {e.wordsLearned}</span>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <p className={styles.empty}>No entries yet — be the first! 🚀</p>
          )}
        </div>
      )}
    </div>
  );
}
