import { useState } from 'react';
import Shell from './components/layout/Shell';
import PayoutsView from './views/PayoutsView';
import LibraryView from './views/LibraryView';
import ArtistsView from './views/ArtistsView';
import GigsView from './views/GigsView';
import SparksView from './views/SparksView';
import MusicPlayerView from './views/MusicPlayerView';
import GroupsView from './views/GroupsView';

const VIEWS = {
  library: LibraryView,
  artists: ArtistsView,
  gigs: GigsView,
  sparks: SparksView,
  player: MusicPlayerView,
  groups: GroupsView,
  payouts: PayoutsView,
};

export default function App() {
  const [activeView, setActiveView] = useState('library');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolume] = useState(70);

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
        isPlaying,
        onTogglePlay: () => setIsPlaying((v) => !v),
        repeat,
        onToggleRepeat: () => setRepeat((v) => !v),
        volume,
        onVolumeChange: setVolume,
      }}
    >
      <ActiveView sparksBalance={sparksBalance} />
    </Shell>
  );
}
