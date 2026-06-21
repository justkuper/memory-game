import type { BoardCard } from '@/lib/vocab';
import styles from './MemoryCard.module.css';

interface Props {
  card:    BoardCard;
  onClick: () => void;
  disabled: boolean;
}

export default function MemoryCard({ card, onClick, disabled }: Props) {
  const isVisible = card.flipped || card.matched;

  return (
    <button
      className={`${styles.card} ${isVisible ? styles.flipped : ''} ${card.matched ? styles.matched : ''}`}
      onClick={onClick}
      disabled={disabled || isVisible}
      aria-label={isVisible ? card.text : 'Hidden card'}
    >
      <span className={styles.inner}>
        {/* Back face */}
        <span className={styles.back}>🇪🇸</span>

        {/* Front face */}
        <span className={`${styles.front} ${card.face === 'spanish' ? styles.es : styles.en}`}>
          <span className={styles.lang}>{card.face === 'spanish' ? 'ES' : 'EN'}</span>
          <span className={styles.word}>{card.text}</span>
        </span>
      </span>
    </button>
  );
}
