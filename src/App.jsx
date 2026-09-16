import { useState } from 'react';
import Shell from './components/layout/Shell';
import ErrorBoundary from './components/layout/ErrorBoundary';
import SetupScreen from './components/layout/SetupScreen';
import { isSupabaseConfigured } from './lib/supabase';
import usePlayerEngine from './hooks/usePlayerEngine';
import PayoutsView from './views/PayoutsView';
import LibraryView from './views/LibraryView';
import ArtistsView from './views/ArtistsView';
import GigsView from './views/GigsView';
import SparksView from './views/SparksView';
import MusicPlayerView from './views/MusicPlayerView';
import GroupsView from './views/GroupsView';
import ShopView from './views/ShopView';

const VIEWS = {
  library: LibraryView,
  artists: ArtistsView,
  gigs: GigsView,
  sparks: SparksView,
  player: MusicPlayerView,
  groups: GroupsView,
  payouts: PayoutsView,
  shop: ShopView,
};

function AppShell() {
  const [activeView, setActiveView] = useState('library');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const player = usePlayerEngine();

  const sparksBalance = 0;

  const ActiveView = VIEWS[activeView] ?? LibraryView;

  return (
    <Shell
      activeView={activeView}
      onSelectView={setActiveView}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      searchValue={search}
      onSearchChange={setSearch}
      sparksBalance={sparksBalance}
      player={{
        nowPlaying: player.nowPlaying,
        isPlaying: player.isPlaying,
        onTogglePlay: player.togglePlay,
        currentTime: player.currentTime,
        duration: player.duration,
        onSeek: player.seek,
        repeat: player.repeat,
        onToggleRepeat: () => player.setRepeat((v) => !v),
        volume: player.volume,
        onVolumeChange: player.setVolume,
      }}
      audioElementProps={player.audioElementProps}
      onPlayTrack={player.playTrack}
    >
      <ActiveView
        sparksBalance={sparksBalance}
        nowPlaying={player.nowPlaying}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        onPlayTrack={player.playTrack}
        onTogglePlay={player.togglePlay}
      />
    </Shell>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupScreen />;
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
