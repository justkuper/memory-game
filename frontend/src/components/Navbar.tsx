import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate          = useNavigate();

  return (
    <nav className={styles.nav}>
      <button className={styles.brand} onClick={() => navigate('/dashboard')}>
        🇪🇸 <span>VocabGame</span>
      </button>

      <div className={styles.links}>
        <NavLink to="/dashboard"  className={({ isActive }) => isActive ? styles.active : styles.link}>Dashboard</NavLink>
        <NavLink to="/game"       className={({ isActive }) => isActive ? styles.active : styles.link}>Play</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => isActive ? styles.active : styles.link}>Leaderboard</NavLink>
        <NavLink to="/settings"   className={({ isActive }) => isActive ? styles.active : styles.link}>Settings</NavLink>
      </div>

      <div className={styles.user}>
        {user?.avatar && (
          <img src={user.avatar!} alt={user.name} className={styles.avatar} />
        )}
        {!user?.avatar && (
          <div className={styles.avatarFallback}>
            {(user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </div>
        )}
        <button className={styles.signOut} onClick={signOut}>Sign out</button>
      </div>
    </nav>
  );
}
