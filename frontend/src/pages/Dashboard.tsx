import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getProgress, type UserProgress } from '@/lib/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [progress, setProgress]     = useState<UserProgress | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    getProgress(user.userId, '')
      .then((p) => setProgress(p))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <h1 className={styles.heading}>
          {greeting()}, {user?.name?.split(' ')[0] ?? 'Learner'} 👋
        </h1>
        <p className={styles.sub}>Ready to expand your Spanish vocabulary?</p>
      </div>

      {/* Play CTA */}
      <button className={styles.playBtn} onClick={() => navigate('/game')}>
        <span className={styles.playIcon}>🃏</span>
        <span>
          <strong>Start Playing</strong>
          <small>Flip cards, match pairs, earn points</small>
        </span>
        <span className={styles.arrow}>→</span>
      </button>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <StatCard
          emoji="🔥"
          label="Current Streak"
          value={`${progress?.streak ?? 0} days`}
          color="var(--primary)"
        />
        <StatCard
          emoji="📚"
          label="Words Learned"
          value={String(progress?.wordsLearned ?? 0)}
          color="#f4a261"
        />
        <StatCard
          emoji="🏆"
          label="Total Score"
          value={(progress?.totalScore ?? 0).toLocaleString()}
          color="var(--accent)"
        />
        <StatCard
          emoji="📅"
          label="Last Played"
          value={
            progress?.lastPlayed
              ? new Date(progress.lastPlayed).toLocaleDateString()
              : '—'
          }
          color="#a29bfe"
        />
      </div>

      {/* Quick level pick */}
      <div className={styles.levelSection}>
        <h2 className={styles.sectionTitle}>Choose a level</h2>
        <div className={styles.levelCards}>
          <LevelCard
            title="Beginner"
            emoji="🌱"
            desc="Greetings, colours, everyday nouns"
            onClick={() => navigate('/game?level=beginner')}
          />
          <LevelCard
            title="Intermediate"
            emoji="🌿"
            desc="Verbs, connectors, travel vocabulary"
            onClick={() => navigate('/game?level=intermediate')}
          />
          <LevelCard
            title="Advanced"
            emoji="🌳"
            desc="Nuanced expressions, cultural terms"
            onClick={() => navigate('/game?level=advanced')}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statEmoji} style={{ color }}>{emoji}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
    </div>
  );
}

function LevelCard({ title, emoji, desc, onClick }: { title: string; emoji: string; desc: string; onClick: () => void }) {
  return (
    <button className={styles.levelCard} onClick={onClick}>
      <span className={styles.levelEmoji}>{emoji}</span>
      <strong>{title}</strong>
      <small>{desc}</small>
    </button>
  );
}
