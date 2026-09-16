import { Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AuthGate, { useAuth } from './components/auth/AuthGate';
import Header from './components/layout/Header';
import ToastViewport from './components/layout/ToastViewport';
import GlobalPlayerBar from './components/audio/GlobalPlayerBar';
import ProfileBoard from './boards/ProfileBoard';
import CustomizeBoard from './boards/CustomizeBoard';
import LibraryBoard from './boards/LibraryBoard';
import ArtistsBoard from './boards/ArtistsBoard';
import GigsBoard from './boards/GigsBoard';
import NotificationsBoard from './boards/NotificationsBoard';
import PlayerBoard from './boards/PlayerBoard';
import GroupsBoard from './boards/GroupsBoard';
import GroupBoard from './boards/GroupBoard';
import PayoutsBoard from './boards/PayoutsBoard';
import StoreBoard from './boards/StoreBoard';
import MessagesBoard from './boards/MessagesBoard';
import MessageThreadBoard from './boards/MessageThreadBoard';
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
          <Route path="/space/:handle" element={<ProfileBoard />} />
          <Route path="/customize" element={<CustomizeBoard />} />
          <Route path="/library" element={<LibraryBoard />} />
          <Route path="/artists" element={<ArtistsBoard />} />
          <Route path="/gigs" element={<GigsBoard />} />
          <Route path="/notifications" element={<NotificationsBoard />} />
          <Route path="/player" element={<PlayerBoard />} />
          <Route path="/groups" element={<GroupsBoard />} />
          <Route path="/groups/:groupId" element={<GroupBoard />} />
          <Route path="/payouts" element={<PayoutsBoard />} />
          <Route path="/store" element={<StoreBoard />} />
          <Route path="/messages" element={<MessagesBoard />} />
          <Route path="/messages/:conversationId" element={<MessageThreadBoard />} />
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
