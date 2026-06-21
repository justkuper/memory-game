import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MemoryCard from '@/components/MemoryCard';
import { getWordsByLevel, buildBoard, type BoardCard, type Level } from '@/lib/vocab';
import { saveProgress, getProgress, getSettings } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Game.module.css';

const PAIR_COUNT    = 8;   // 8 pairs = 16 cards per round
const FLIP_DELAY_MS = 900; // how long mismatched cards stay flipped

export default function Game() {
  const { user }  = useAuth();
  const navigate          = useNavigate();

  const [level, setLevel]       = useState<Level>('beginner');
  const [cards, setCards]       = useState<BoardCard[]>([]);
  const [flipped, setFlipped]   = useState<string[]>([]); // uids of currently-flipped cards
  const [moves, setMoves]       = useState(0);
  const [matched, setMatched]   = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [running, setRunning]   = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore]       = useState(0);
  const [locked, setLocked]     = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load user's preferred level from settings
  useEffect(() => {
    if (!user) return;
    getSettings(user.userId, '')
      .then((s) => setLevel(s.level))
      .catch(() => {/* fallback to beginner */});
  }, [user]);

  const startGame = useCallback((lvl: Level = level) => {
    const pairs  = getWordsByLevel(lvl, PAIR_COUNT);
    const board  = buildBoard(pairs);
    setCards(board);
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setElapsed(0);
    setScore(0);
    setFinished(false);
    setLocked(false);
    setRunning(true);
  }, [level]);

  // Start on mount
  useEffect(() => { startGame(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    if (running && !finished) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, finished]);

  const handleCardClick = useCallback((uid: string) => {
    if (locked) return;
    if (flipped.includes(uid)) return;
    if (flipped.length === 2) return;

    const next = [...flipped, uid];
    setFlipped(next);
    setCards((prev) => prev.map((c) => (c.uid === uid ? { ...c, flipped: true } : c)));

    if (next.length < 2) return;

    setMoves((m) => m + 1);
    setLocked(true);

    const [a, b] = next.map((id) => cards.find((c) => c.uid === id)!);

    if (a.pairId === b.pairId && a.face !== b.face) {
      // Match!
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => (c.pairId === a.pairId ? { ...c, matched: true, flipped: true } : c))
        );
        setFlipped([]);
        setLocked(false);
        setMatched((m) => {
          const newMatched = m + 1;
          if (newMatched === PAIR_COUNT) {
            setRunning(false);
            setFinished(true);
            const finalScore = calcScore(PAIR_COUNT, moves + 1, elapsed);
            setScore(finalScore);
            persistProgress(finalScore);
          }
          return newMatched;
        });
      }, 300);
    } else {
      // No match — flip back
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => (next.includes(c.uid) ? { ...c, flipped: false } : c))
        );
        setFlipped([]);
        setLocked(false);
      }, FLIP_DELAY_MS);
    }
  }, [locked, flipped, cards, moves, elapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  async function persistProgress(finalScore: number) {
    if (!user) return;
    try {
      const current = await getProgress(user.userId, '');
      await saveProgress(
        {
          userId:       user.userId,
          displayName:  user.name || user.email,
          wordsLearned: (current?.wordsLearned ?? 0) + PAIR_COUNT,
          totalScore:   (current?.totalScore ?? 0) + finalScore,
          lastPlayed:   new Date().toISOString(),
        },
        ''
      );
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const changeLevel = (l: Level) => {
    setLevel(l);
    startGame(l);
  };

  return (
    <div className={styles.page}>
      {/* Header bar */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>← Back</button>

        <div className={styles.levelTabs}>
          {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
            <button
              key={l}
              className={`${styles.tab} ${level === l ? styles.active : ''}`}
              onClick={() => changeLevel(l)}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.stats}>
          <span className={styles.stat}>⏱ {fmt(elapsed)}</span>
          <span className={styles.stat}>🔄 {moves}</span>
          <span className={styles.stat}>✅ {matched}/{PAIR_COUNT}</span>
        </div>
      </div>

      {/* Card grid */}
      <div className={styles.grid}>
        {cards.map((card) => (
          <MemoryCard
            key={card.uid}
            card={card}
            onClick={() => handleCardClick(card.uid)}
            disabled={locked || finished}
          />
        ))}
      </div>

      {/* Finished overlay */}
      {finished && (
        <div className={styles.overlay}>
          <div className={styles.result}>
            <div className={styles.trophy}>🏆</div>
            <h2>Round Complete!</h2>
            <p className={styles.scoreLabel}>Score</p>
            <p className={styles.scoreBig}>{score.toLocaleString()}</p>
            <div className={styles.resultStats}>
              <div><span>{moves}</span><small>Moves</small></div>
              <div><span>{fmt(elapsed)}</span><small>Time</small></div>
              <div><span>{PAIR_COUNT}</span><small>Pairs</small></div>
            </div>
            <div className={styles.resultBtns}>
              <button className={styles.btnPrimary} onClick={() => startGame()}>Play Again</button>
              <button className={styles.btnSecondary} onClick={() => navigate('/dashboard')}>Dashboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calcScore(pairs: number, moves: number, seconds: number): number {
  const base     = pairs * 100;
  const movePen  = Math.max(0, moves - pairs) * 5;
  const timePen  = Math.floor(seconds / 10) * 2;
  return Math.max(0, base - movePen - timePen);
}
