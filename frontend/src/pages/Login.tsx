import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth, type GoogleProfile, type FacebookProfile } from '@/contexts/AuthContext';
import styles from './Login.module.css';

// ── Load Facebook JS SDK once ──────────────────────────────────────────────────
declare global {
  interface Window {
    FB: any;            // eslint-disable-line @typescript-eslint/no-explicit-any
    fbAsyncInit: () => void;
  }
}

function loadFbSdk(appId: string): Promise<typeof window.FB> {
  return new Promise((resolve) => {
    if (window.FB) { resolve(window.FB); return; }
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' });
      resolve(window.FB);
    };
    const s = document.createElement('script');
    s.src   = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    s.defer = true;
    document.body.appendChild(s);
  });
}

// ── Pending profile shown in confirmation modal ────────────────────────────────
interface PendingProfile {
  name:     string;
  email:    string;
  avatar:   string | null;
  provider: 'google' | 'facebook';
  raw:      GoogleProfile | FacebookProfile;
}

export default function Login() {
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [pendingProfile, setPendingProfile] = useState<PendingProfile | null>(null);

  // ── Google OAuth (popup) ───────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch Google profile');
        const profile: GoogleProfile = await res.json();
        // Show confirmation modal before completing sign-in (same as budget buddy)
        setPendingProfile({
          name:     profile.name,
          email:    profile.email,
          avatar:   profile.picture,
          provider: 'google',
          raw:      profile,
        });
      } catch (err) {
        setError((err as Error).message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
  });

  // ── Facebook OAuth (JS SDK popup) ──────────────────────────────────────────
  const handleFacebook = async () => {
    setError('');
    setLoading(true);
    try {
      const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
      if (!FB_APP_ID) {
        throw new Error('Facebook App ID not configured. Add VITE_FACEBOOK_APP_ID to your .env');
      }
      const FB = await loadFbSdk(FB_APP_ID);

      const authResponse = await new Promise<any>((resolve, reject) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
        FB.login(
          (res: any) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
            res.authResponse ? resolve(res.authResponse) : reject(new Error('Facebook sign-in was cancelled.'));
          },
          { scope: 'public_profile,email' }
        );
      });

      const profileData = await new Promise<any>((resolve, reject) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
        FB.api(
          '/me',
          { fields: 'id,name,email,picture.type(large)', access_token: authResponse.accessToken },
          (data: any) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
            data && !data.error ? resolve(data) : reject(new Error(data?.error?.message || 'Failed to fetch Facebook profile'));
          }
        );
      });

      setPendingProfile({
        name:     profileData.name,
        email:    profileData.email || '',
        avatar:   profileData.picture?.data?.url || null,
        provider: 'facebook',
        raw: {
          sub:     profileData.id,
          name:    profileData.name,
          email:   profileData.email || '',
          picture: profileData.picture?.data?.url || null,
        },
      });
    } catch (err) {
      setError((err as Error).message || 'Facebook sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm and complete sign-in ───────────────────────────────────────────
  const handleConfirmSignIn = async () => {
    if (!pendingProfile) return;
    setLoading(true);
    try {
      if (pendingProfile.provider === 'google') {
        await signInWithGoogle(pendingProfile.raw as GoogleProfile);
      } else {
        await signInWithFacebook(pendingProfile.raw as FacebookProfile);
      }
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Sign-in failed');
    } finally {
      setLoading(false);
      setPendingProfile(null);
    }
  };

  return (
    <div className={styles.page}>
      {/* Logo */}
      <div className={styles.header}>
        <span className={styles.logo}>🇪🇸</span>
        <h1 className={styles.appName}>VocabGame</h1>
        <p className={styles.tagline}>Master Spanish one card at a time</p>
      </div>

      {/* Card */}
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome back</h2>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        <div className={styles.divider}><span>Continue with</span></div>

        <div className={styles.socialButtons}>
          <button
            className={`${styles.btnSocial} ${styles.btnGoogle}`}
            onClick={() => googleLogin()}
            disabled={loading}
          >
            <GoogleIcon />
            {loading ? 'Loading…' : 'Continue with Google'}
          </button>

          <button
            className={`${styles.btnSocial} ${styles.btnFacebook}`}
            onClick={handleFacebook}
            disabled={loading}
          >
            <FacebookIcon />
            {loading ? 'Loading…' : 'Continue with Facebook'}
          </button>
        </div>

        <p className={styles.legal}>
          By signing in you agree to our{' '}
          <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
        </p>
      </div>

      {/* Confirm sign-in modal (same pattern as budget buddy) */}
      {pendingProfile && (
        <div className={styles.overlay} onClick={() => !loading && setPendingProfile(null)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />

            <div className={styles.confirmProvider}>
              {pendingProfile.provider === 'google' ? <GoogleIcon /> : <FacebookIconBlue />}
              <span>Sign in with {pendingProfile.provider === 'google' ? 'Google' : 'Facebook'}</span>
            </div>

            <p className={styles.confirmDesc}>
              VocabGame will access your name, email address, and profile photo.
            </p>

            <div className={styles.confirmProfile}>
              {pendingProfile.avatar
                ? <img src={pendingProfile.avatar} alt="" className={styles.confirmAvatar} />
                : <div className={`${styles.confirmAvatar} ${styles.confirmAvatarFallback}`}>
                    {(pendingProfile.name || 'U')[0]}
                  </div>
              }
              <div>
                <p className={styles.confirmName}>{pendingProfile.name}</p>
                <p className={styles.confirmEmail}>{pendingProfile.email}</p>
              </div>
            </div>

            <div className={styles.confirmBtns}>
              <button
                className={styles.btnCancel}
                onClick={() => setPendingProfile(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={styles.btnContinue}
                onClick={handleConfirmSignIn}
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function FacebookIconBlue() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
