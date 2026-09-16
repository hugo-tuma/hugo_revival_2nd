import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AuthGate, { useAuth } from './components/auth/AuthGate';
import Header from './components/layout/Header';
import ToastViewport from './components/layout/ToastViewport';
import GlobalPlayerBar from './components/audio/GlobalPlayerBar';
import HomeBoard from './boards/HomeBoard';
import ArtistBoard from './boards/ArtistBoard';
import CustomizeBoard from './boards/CustomizeBoard';
import { usePresence } from './hooks/usePresence';

function AppShell() {
  const { profile } = useAuth();
  usePresence(profile);

  return (
    <div className="min-h-screen bg-cream font-mono text-ink">
      <Header />
      <main className="pb-28 lg:pb-16">
        <Routes>
          <Route path="/" element={<Navigate to={`/space/${profile.handle}`} replace />} />
          <Route path="/space/:handle" element={<HomeBoard />} />
          <Route path="/artist/:handle" element={<ArtistBoard />} />
          <Route path="/customize" element={<CustomizeBoard />} />
          <Route path="*" element={<Navigate to={`/space/${profile.handle}`} replace />} />
        </Routes>
      </main>
      <GlobalPlayerBar />
      <ToastViewport />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </ErrorBoundary>
  );
}
