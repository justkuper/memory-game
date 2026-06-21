import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/contexts/AuthContext';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function Root() {
  // GoogleOAuthProvider requires a non-empty clientId — skip wrapper if not configured
  // so the app still loads (Google button will show an error, but nothing crashes)
  if (!GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will not work.');
    return (
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
