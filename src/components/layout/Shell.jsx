import TopBar from './TopBar';
import Sidebar from './Sidebar';
import BottomTransportBar from './BottomTransportBar';

export default function Shell({
  activeView,
  onSelectView,
  sidebarCollapsed,
  onToggleSidebar,
  searchValue,
  onSearchChange,
  sparksBalance,
  player,
  audioElementProps,
  onPlayTrack,
  children,
}) {
  return (
    <div className="flex h-screen flex-col bg-canvas font-sans text-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio {...audioElementProps} />

      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        sparksBalance={sparksBalance}
        onSelectView={onSelectView}
        onPlayTrack={onPlayTrack}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar activeView={activeView} onSelect={onSelectView} collapsed={sidebarCollapsed} />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      <BottomTransportBar
        nowPlaying={player.nowPlaying}
        isPlaying={player.isPlaying}
        onTogglePlay={player.onTogglePlay}
        currentTime={player.currentTime}
        duration={player.duration}
        onSeek={player.onSeek}
        repeat={player.repeat}
        onToggleRepeat={player.onToggleRepeat}
        volume={player.volume}
        onVolumeChange={player.onVolumeChange}
      />
    </div>
  );
}
