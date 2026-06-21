import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSettings, saveSettings, type UserSettings } from '@/lib/api';
import styles from './Settings.module.css';

type Level = UserSettings['level'];

export default function Settings() {
  const { user }                   = useAuth();
  const [settings, setSettings]    = useState<UserSettings | null>(null);
  const [saving,   setSaving]      = useState(false);
  const [saved,    setSaved]       = useState(false);
  const [loading,  setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    getSettings(user.userId, '')
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings, '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  if (loading || !settings) return <div className={styles.loading}>Loading…</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>⚙️ Settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Learning</h2>

        <div className={styles.field}>
          <label className={styles.label}>Default Level</label>
          <div className={styles.segmented}>
            {(['beginner', 'intermediate', 'advanced'] as Level[]).map((l) => (
              <button
                key={l}
                className={`${styles.seg} ${settings.level === l ? styles.segActive : ''}`}
                onClick={() => update('level', l)}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
          <small className={styles.hint}>New games will start at this difficulty.</small>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Daily Goal — <strong>{settings.dailyGoal} words</strong>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={settings.dailyGoal}
            onChange={(e) => update('dailyGoal', Number(e.target.value))}
            className={styles.range}
          />
          <div className={styles.rangeLabels}>
            <span>5</span><span>25</span><span>50</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>

        <div className={styles.field}>
          <label className={styles.label}>Theme</label>
          <div className={styles.segmented}>
            {(['dark', 'light'] as UserSettings['theme'][]).map((t) => (
              <button
                key={t}
                className={`${styles.seg} ${settings.theme === t ? styles.segActive : ''}`}
                onClick={() => update('theme', t)}
              >
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.accountRow}>
          {user?.avatar && <img src={user.avatar} alt={user.name} className={styles.avatar} />}
          <div>
            <div className={styles.accountName}>{user?.name}</div>
            <div className={styles.accountEmail}>{user?.email}</div>
          </div>
        </div>
      </section>

      <button
        className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
