import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar      from '@/components/Navbar';
import Login       from '@/pages/Login';
import Callback    from '@/pages/Callback';
import Dashboard   from '@/pages/Dashboard';
import Game        from '@/pages/Game';
import Leaderboard from '@/pages/Leaderboard';
import Settings    from '@/pages/Settings';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user)   return <Navigate to="/" replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function LoginRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<LoginRedirect />} />
        <Route path="/callback"    element={<Callback />} />
        <Route path="/dashboard"   element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/game"        element={<ProtectedLayout><Game /></ProtectedLayout>} />
        <Route path="/leaderboard" element={<ProtectedLayout><Leaderboard /></ProtectedLayout>} />
        <Route path="/settings"    element={<ProtectedLayout><Settings /></ProtectedLayout>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
