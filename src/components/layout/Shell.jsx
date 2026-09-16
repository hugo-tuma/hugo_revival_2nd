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
  children,
}) {
  return (
    <div className="flex h-screen flex-col bg-canvas font-sans text-black">
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        sparksBalance={sparksBalance}
        onSelectView={onSelectView}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar activeView={activeView} onSelect={onSelectView} collapsed={sidebarCollapsed} />
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      <BottomTransportBar
        isPlaying={player.isPlaying}
        onTogglePlay={player.onTogglePlay}
        repeat={player.repeat}
        onToggleRepeat={player.onToggleRepeat}
        volume={player.volume}
        onVolumeChange={player.onVolumeChange}
      />
    </div>
  );
}
