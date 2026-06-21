// This route exists for future Cognito hosted-UI integration.
// The current auth flow (Google/Facebook popup) doesn't use it.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Callback.module.css';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    // If we ever get here without a code param, just go home
    const params = new URLSearchParams(window.location.search);
    if (!params.get('code')) {
      navigate('/', { replace: true });
    }
    // Future: exchange Cognito auth code here
  }, [navigate]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} aria-label="Signing you in…" />
      <p className={styles.label}>Signing you in…</p>
    </div>
  );
}
