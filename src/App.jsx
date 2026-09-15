import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Zap, GitFork, Play, Pause, Music2, MessageCircle, ExternalLink, Send,
  Users, BadgeCheck, Heart, TrendingUp, ChevronRight, Home as HomeIcon,
  User, Palette, MapPin, Ticket, Pin, Sparkles, Check, X, Volume2,
  ShoppingBag, Radio, Settings2, RefreshCcw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Mock data models                                                    */
/* ------------------------------------------------------------------ */

const CURRENT_USER = {
  id: 'u0',
  handle: '@nova_wave',
  name: 'Nova Wave',
  avatar: 'NW',
  color: '#FF4F00',
  forkedFrom: '@glitch_mother',
  forkCount: 142,
};

const INITIAL_TRACKS = {
  home: { id: 1, title: 'Static Bloom', artist: 'Nova Wave', duration: 184 },
  wip: { id: 2, title: 'mixing session 04 (unmastered)', artist: 'Nova Wave', duration: 231 },
};

const INITIAL_TOP8 = [
  { id: 't1', name: 'Glitch Mother', handle: '@glitch_mother', color: '#111111', online: true, listeningTo: 'Static Bloom' },
  { id: 't2', name: 'Reel to Reel', handle: '@reeltoreel', color: '#FF4F00', online: true, listeningTo: null },
  { id: 't3', name: 'Kilo Static', handle: '@kilostatic', color: '#111111', online: false, listeningTo: null },
  { id: 't4', name: 'Paper Moth', handle: '@papermoth', color: '#FF4F00', online: true, listeningTo: 'Dial Tone Ballet' },
  { id: 't5', name: 'Dry Ice', handle: '@dryice', color: '#111111', online: false, listeningTo: null },
  { id: 't6', name: 'Low Orbit', handle: '@loworbit', color: '#FF4F00', online: true, listeningTo: null },
  { id: 't7', name: 'Vantablack FM', handle: '@vantablackfm', color: '#111111', online: false, listeningTo: null },
  { id: 't8', name: 'Cassette Ghost', handle: '@cassetteghost', color: '#FF4F00', online: true, listeningTo: 'Static Bloom' },
];

const INITIAL_FEED = [
  { id: 'f1', type: 'music', author: 'Nova Wave', isTop8: false, timestamp: '2m ago', text: 'dropped a new one —', track: 'Static Bloom' },
  { id: 'f2', type: 'post', author: 'Glitch Mother', isTop8: true, timestamp: '18m ago', text: 'your space theme goes so hard, forking this for the weekend' },
  { id: 'f3', type: 'post', author: 'Reel to Reel', isTop8: true, timestamp: '41m ago', text: 'front row for the Bristol gig, who else is going' },
  { id: 'f4', type: 'music', author: 'Paper Moth', isTop8: true, timestamp: '1h ago', text: 'currently obsessed with —', track: 'Dial Tone Ballet' },
  { id: 'f5', type: 'post', author: 'Kilo Static', isTop8: false, timestamp: '3h ago', text: 'the WIP stems on the artist page are unreal, that bridge section' },
  { id: 'f6', type: 'post', author: 'Cassette Ghost', isTop8: true, timestamp: '5h ago', text: 'top 8 shuffle incoming, sorry in advance' },
];

const INITIAL_ONLINE = INITIAL_TOP8.filter((f) => f.online).map((f) => ({ id: f.id, name: f.name, handle: f.handle, color: f.color }));

const INITIAL_COMMENTS = [
  { id: 'c1', author: 'Glitch Mother', timestamp: '1h ago', text: 'the new banner is unreal, tell me the CSS secrets' },
  { id: 'c2', author: 'Dry Ice', timestamp: '4h ago', text: 'saw you at the merch table, the shirt slaps' },
];

const GIGS = [
  { id: 'g1', date: 'OCT 04', venue: 'The Waiting Room', city: 'Bristol, UK', status: 'On Sale', price: '£14' },
  { id: 'g2', date: 'OCT 19', venue: 'Static Hall', city: 'Leeds, UK', status: 'On Sale', price: '£16' },
  { id: 'g3', date: 'NOV 02', venue: 'Low End Theory', city: 'Manchester, UK', status: 'Sold Out', price: '£16' },
];

const MERCH = [
  { id: 'm1', name: 'Static Bloom Tee', price: 350, color: '#111111', variants: ['S', 'M', 'L', 'XL'] },
  { id: 'm2', name: 'Dial Tone Cap', price: 220, color: '#FF4F00', variants: ['One size'] },
];

const WIP_NOTES = [
  { id: 'n1', pos: 12, author: 'Reel to Reel', text: 'this intro texture is insane, what plugin' },
  { id: 'n2', pos: 47, author: 'Paper Moth', text: 'the drop could hit harder here imo' },
  { id: 'n3', pos: 78, author: 'Kilo Static', text: 'bridge >>> keep this exact take' },
];

const BADGES = [
  { id: 'b1', name: 'OG Badge', price: 100, icon: Sparkles },
  { id: 'b2', name: 'Supporter Badge', price: 60, icon: Heart },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function seededBars(seed, count = 46) {
  const arr = [];
  let x = seed * 9973 + 13;
  for (let i = 0; i < count; i++) {
    x = (x * 16807) % 2147483647;
    const v = x / 2147483647;
    arr.push(16 + Math.round(v * 74));
  }
  return arr;
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// Naive selector scoping so user-authored CSS can't leak past the space.
function scopeCss(raw, scopeSelector = '.user-space-scope') {
  if (!raw || !raw.trim()) return '';
  return raw
    .split('}')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((rule) => {
      const idx = rule.indexOf('{');
      if (idx === -1) return '';
      const selectorPart = rule.slice(0, idx).trim();
      const body = rule.slice(idx + 1);
      if (!selectorPart) return '';
      const scoped = selectorPart
        .split(',')
        .map((s) => `${scopeSelector} ${s.trim()}`)
        .join(', ');
      return `${scoped} { ${body} }`;
    })
    .join('\n');
}

const DEFAULT_RAW_CSS = `.space-card {
  border-color: var(--accent);
}
.space-btn {
  background: var(--accent);
  color: var(--bg);
}`;

/* ------------------------------------------------------------------ */
/* Small shared UI                                                      */
/* ------------------------------------------------------------------ */

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full gap-3 py-2"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={`relative w-11 h-6 border-2 border-black shrink-0 transition-colors ${
          checked ? 'bg-spark' : 'bg-cream'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-black transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function SectionHeading({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 border-b-2 border-black px-3 py-2 bg-black text-cream">
      {Icon && <Icon size={14} />}
      <h2 className="text-xs font-bold uppercase tracking-widest">{children}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audio player (shared by Home track + Artist WIP stem)               */
/* ------------------------------------------------------------------ */

function AudioPlayer({ track, variant = 'home', notes = null, autoplayDefault = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoplay, setAutoplay] = useState(autoplayDefault);
  const [activeNote, setActiveNote] = useState(notes ? notes[0] : null);
  const bars = useMemo(() => seededBars(track.id), [track.id]);

  useEffect(() => {
    setAutoplay(autoplayDefault);
  }, [autoplayDefault]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (track.duration * 4);
        if (next >= 100) {
          if (autoplay) return 0;
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [isPlaying, autoplay, track.duration]);

  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
  };

  const currentSec = (track.duration * progress) / 100;
  const isWip = variant === 'wip';

  return (
    <div className={`border-2 border-black p-3 ${isWip ? 'border-dashed' : ''} bg-cream space-card`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-10 h-10 shrink-0 flex items-center justify-center bg-black text-cream border-2 border-black hover:bg-spark hover:text-black transition-colors space-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate flex items-center gap-1">
            {isWip && <Radio size={12} className="text-spark" />}
            {track.title}
          </p>
          <p className="text-[11px] text-black/60 truncate">{track.artist}</p>
        </div>
        <label className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wide shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
            className="accent-black w-3.5 h-3.5"
          />
          Autoplay
        </label>
      </div>

      <div
        className="relative mt-3 flex items-end gap-[2px] h-14 cursor-pointer select-none"
        onClick={handleScrub}
        role="slider"
        aria-label="Scrub track"
        aria-valuenow={Math.round(progress)}
      >
        {bars.map((h, i) => {
          const barPct = (i / bars.length) * 100;
          const played = barPct <= progress;
          return (
            <div
              key={i}
              style={{ height: `${h}%`, backgroundColor: played ? 'var(--accent, #FF4F00)' : '#111111' }}
              className="flex-1"
            />
          );
        })}
        {notes &&
          notes.map((n) => (
            <button
              key={n.id}
              onClick={(e) => {
                e.stopPropagation();
                setProgress(n.pos);
                setActiveNote(n);
              }}
              style={{ left: `${n.pos}%` }}
              className="absolute -top-4 -translate-x-1/2 text-black hover:text-spark"
              title={`${n.author}: ${n.text}`}
            >
              <Pin size={12} fill={activeNote?.id === n.id ? '#FF4F00' : 'transparent'} />
            </button>
          ))}
      </div>

      <div className="flex items-center justify-between mt-1 text-[10px] font-bold text-black/60">
        <span>{formatTime(currentSec)}</span>
        <span>{formatTime(track.duration)}</span>
      </div>

      {notes && activeNote && (
        <div className="mt-3 border-2 border-black bg-white p-2 flex items-start gap-2">
          <Pin size={12} className="mt-0.5 shrink-0 text-spark" />
          <p className="text-xs">
            <span className="font-bold">{activeNote.author}</span>{' '}
            <span className="text-black/50">@ {Math.round((activeNote.pos / 100) * track.duration)}s</span>
            <br />
            {activeNote.text}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home board pieces                                                    */
/* ------------------------------------------------------------------ */

function ProfileCard({ user, mood, onMoodChange, badges }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mood);

  const save = () => {
    onMoodChange(draft.trim() || mood);
    setEditing(false);
  };

  return (
    <div className="border-2 border-black bg-white p-3 space-card">
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 border-2 border-black flex items-center justify-center font-black text-lg shrink-0"
          style={{ backgroundColor: user.color, color: user.color === '#111111' ? '#FDFBF7' : '#111111' }}
        >
          {user.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p className="font-black leading-none">{user.name}</p>
            {badges.map((b) => (
              <b.icon key={b.id} size={13} className="text-spark" />
            ))}
          </div>
          <p className="text-xs text-black/50">{user.handle}</p>
        </div>
      </div>

      <div className="mt-3">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full border-2 border-black px-2 py-1 text-xs font-mono"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(mood);
              setEditing(true);
            }}
            className="text-xs italic text-left w-full hover:text-spark"
            title="Click to edit mood status"
          >
            &ldquo;{mood}&rdquo;
          </button>
        )}
      </div>

      <div className="mt-3 inline-flex items-center gap-1 border-2 border-black bg-cream px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
        <GitFork size={11} />
        Forked from {user.forkedFrom} ({user.forkCount} forks)
      </div>
    </div>
  );
}

function Top8Grid({ top8 }) {
  return (
    <div className="border-2 border-black bg-white">
      <SectionHeading icon={Users}>Top 8</SectionHeading>
      <div className="grid grid-cols-4 gap-1.5 p-1.5">
        {top8.map((f) => (
          <div
            key={f.id}
            className="group relative aspect-square border-2 border-black overflow-hidden cursor-pointer"
            style={{ backgroundColor: f.color }}
          >
            <div
              className="w-full h-full flex items-center justify-center font-black text-sm"
              style={{ color: f.color === '#111111' ? '#FDFBF7' : '#111111' }}
            >
              {f.name.split(' ').map((w) => w[0]).join('')}
            </div>
            <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-cream p-1 text-center">
              <p className="text-[10px] font-bold leading-tight">{f.name}</p>
              <p className="text-[9px] text-cream/60 leading-tight">{f.handle}</p>
              <div className="flex items-center gap-2 mt-1">
                <MessageCircle size={12} />
                <ExternalLink size={12} />
              </div>
            </div>
            {f.online && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 border border-black animate-blink-dot" />
            )}
            {f.listeningTo && (
              <div className="absolute bottom-0 left-0 right-0 bg-spark text-black text-[8px] font-bold px-1 py-0.5 flex items-center gap-1 truncate">
                <Music2 size={9} className="shrink-0" />
                <span className="truncate">{f.listeningTo}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const FEED_FILTERS = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'top8', label: 'Top 8' },
  { id: 'music', label: 'Music only' },
];

function ActivityFeed({ items }) {
  const [filter, setFilter] = useState('everyone');

  const filtered = items.filter((item) => {
    if (filter === 'top8') return item.isTop8;
    if (filter === 'music') return item.type === 'music';
    return true;
  });

  return (
    <div className="border-2 border-black bg-white">
      <SectionHeading icon={Radio}>Activity</SectionHeading>
      <div className="flex border-b-2 border-black">
        {FEED_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 text-[10px] font-bold uppercase tracking-wide py-2 border-r-2 border-black last:border-r-0 transition-colors ${
              filter === f.id ? 'bg-spark text-black' : 'bg-cream hover:bg-black/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 && (
          <p className="p-4 text-xs text-black/40 text-center">Nothing here yet.</p>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="flex gap-3 px-3 py-3 border-b-2 border-black/10 last:border-b-0">
            <div className="w-8 h-8 shrink-0 border-2 border-black bg-black text-cream flex items-center justify-center text-[10px] font-bold">
              {item.author.split(' ').map((w) => w[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-bold">{item.author}</span>
                {item.isTop8 && <span className="text-[9px] uppercase font-bold text-spark">Top 8</span>}
                <span className="text-[10px] text-black/40 ml-auto">{item.timestamp}</span>
              </div>
              <p className="text-xs mt-0.5">{item.text}</p>
              {item.type === 'music' && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 border-2 border-black px-2 py-1 text-[10px] font-bold bg-cream">
                  <Music2 size={11} className="text-spark" />
                  {item.track}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-5 px-3 text-[10px] uppercase tracking-widest text-black/40 border-t-2 border-dashed border-black/20">
        — That&rsquo;s everything from today. —
      </div>
    </div>
  );
}

function RightRail({ online, comments, onPost, wallVisible }) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    onPost(draft.trim());
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-black bg-white">
        <SectionHeading icon={Users}>Online now ({online.length})</SectionHeading>
        <div className="p-2 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          {online.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 animate-blink-dot" />
              </span>
              <div
                className="w-6 h-6 border-2 border-black flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ backgroundColor: f.color, color: f.color === '#111111' ? '#FDFBF7' : '#111111' }}
              >
                {f.name.split(' ').map((w) => w[0]).join('')}
              </div>
              <span className="text-xs font-semibold truncate">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {wallVisible && (
        <div className="border-2 border-black bg-white">
          <SectionHeading icon={MessageCircle}>Wall</SectionHeading>
          <div className="p-2 flex gap-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Leave a comment..."
              className="flex-1 border-2 border-black px-2 py-1 text-xs font-mono min-w-0"
            />
            <button
              onClick={submit}
              className="border-2 border-black bg-black text-cream px-2 hover:bg-spark hover:text-black transition-colors space-btn"
              aria-label="Post comment"
            >
              <Send size={13} />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="px-3 py-2 border-t-2 border-black/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{c.author}</span>
                  <span className="text-[10px] text-black/40">{c.timestamp}</span>
                </div>
                <p className="text-xs mt-0.5">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home board                                                          */
/* ------------------------------------------------------------------ */

function HomeBoard({ state, actions }) {
  return (
    <div
      className="user-space-scope grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-4 p-4"
      style={{ '--accent': state.themeVars.accent, '--bg': state.themeVars.bg, '--text': state.themeVars.text }}
    >
      <style>{scopeCss(state.appliedCss)}</style>

      <div className="flex flex-col gap-4">
        <ProfileCard user={CURRENT_USER} mood={state.mood} onMoodChange={actions.setMood} badges={state.ownedBadges} />
        <AudioPlayer track={INITIAL_TRACKS.home} autoplayDefault={state.layout.autoplay} />
        {state.layout.showTop8 && <Top8Grid top8={INITIAL_TOP8} />}
      </div>

      <ActivityFeed items={INITIAL_FEED} />

      <RightRail
        online={INITIAL_ONLINE}
        comments={state.comments}
        onPost={actions.addComment}
        wallVisible={state.layout.wallVisible}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Artist board                                                        */
/* ------------------------------------------------------------------ */

function ArtistBoard({ sparks, onSpend }) {
  const [purchased, setPurchased] = useState({});
  const [variants, setVariants] = useState({ m1: 'M', m2: 'One size' });
  const [supported, setSupported] = useState(false);

  const buyMerch = (item) => {
    if (purchased[item.id]) return;
    if (sparks < item.price) return;
    onSpend(item.price, `merch: ${item.name}`);
    setPurchased((p) => ({ ...p, [item.id]: true }));
    setTimeout(() => setPurchased((p) => ({ ...p, [item.id]: false })), 2400);
  };

  const tip = (amount) => onSpend(amount, 'tip');

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="border-2 border-black bg-white">
        <div className="h-24 bg-black" />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 -mt-8">
            <div className="w-20 h-20 border-2 border-black bg-spark flex items-center justify-center font-black text-2xl">
              NW
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1">
                <h1 className="text-lg font-black">Nova Wave</h1>
                <BadgeCheck size={16} className="text-spark" fill="#111111" />
              </div>
              <p className="text-xs text-black/50 flex items-center gap-1">
                <Users size={11} /> 1,204 friends follow
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 pb-1">
              <button
                onClick={() => tip(20)}
                className="border-2 border-black bg-cream px-3 py-1.5 text-xs font-bold hover:bg-spark transition-colors flex items-center gap-1"
              >
                <Zap size={12} /> Tip 20
              </button>
              <button
                onClick={() => setSupported((s) => !s)}
                className={`border-2 border-black px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-colors ${
                  supported ? 'bg-black text-cream' : 'bg-spark text-black hover:bg-black hover:text-cream'
                }`}
              >
                <Heart size={12} fill={supported ? 'currentColor' : 'none'} />
                {supported ? 'Supporting monthly' : 'Support monthly'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Ticket}>Upcoming gigs</SectionHeading>
          <div className="p-3 flex flex-col gap-2">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-spark/20 border-2 border-spark px-2 py-1 w-fit">
              <TrendingUp size={11} /> 92% goes direct to the band
            </div>
            {GIGS.map((g) => (
              <div key={g.id} className="flex items-center gap-3 border-2 border-black p-2">
                <div className="text-center shrink-0 w-12">
                  <p className="text-[10px] font-black leading-none">{g.date}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{g.venue}</p>
                  <p className="text-[10px] text-black/50 flex items-center gap-1">
                    <MapPin size={10} /> {g.city}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-1 border-2 border-black shrink-0 ${
                    g.status === 'On Sale' ? 'bg-spark text-black' : 'bg-black text-cream'
                  }`}
                >
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Radio}>Work in progress</SectionHeading>
          <div className="p-3">
            <AudioPlayer track={INITIAL_TRACKS.wip} variant="wip" notes={WIP_NOTES} />
          </div>
        </div>
      </div>

      <div className="border-2 border-black bg-white">
        <SectionHeading icon={ShoppingBag}>Merch</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
          {MERCH.map((item) => (
            <div key={item.id} className="border-2 border-black">
              <div className="h-28 border-b-2 border-black" style={{ backgroundColor: item.color }} />
              <div className="p-2 flex flex-col gap-1.5">
                <p className="text-xs font-bold">{item.name}</p>
                <p className="text-[11px] font-bold flex items-center gap-1">
                  <Zap size={11} className="text-spark" /> {item.price}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVariants((s) => ({ ...s, [item.id]: v }))}
                      className={`text-[10px] font-bold border-2 border-black px-1.5 py-0.5 ${
                        variants[item.id] === v ? 'bg-black text-cream' : 'bg-cream'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => buyMerch(item)}
                  disabled={sparks < item.price}
                  className={`mt-1 border-2 border-black text-[10px] font-bold uppercase py-1.5 flex items-center justify-center gap-1 transition-colors ${
                    purchased[item.id]
                      ? 'bg-green-400'
                      : sparks < item.price
                      ? 'bg-black/10 text-black/30 cursor-not-allowed'
                      : 'bg-spark hover:bg-black hover:text-cream'
                  }`}
                >
                  {purchased[item.id] ? (
                    <>
                      <Check size={11} /> Purchased
                    </>
                  ) : sparks < item.price ? (
                    'Not enough Sparks'
                  ) : (
                    <>
                      <Zap size={11} /> Buy with Sparks
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customize board                                                     */
/* ------------------------------------------------------------------ */

function CustomizeBoard({ state, actions }) {
  const [draftCss, setDraftCss] = useState(state.appliedCss);
  const [liveApply, setLiveApply] = useState(true);

  const handleDraftChange = (val) => {
    setDraftCss(val);
    if (liveApply) actions.setAppliedCss(val);
  };

  const applyNow = () => actions.setAppliedCss(draftCss);
  const resetCss = () => {
    setDraftCss(DEFAULT_RAW_CSS);
    actions.setAppliedCss(DEFAULT_RAW_CSS);
  };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">
        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Settings2}>Layout toggles</SectionHeading>
          <div className="p-3 divide-y-2 divide-black/10">
            <ToggleSwitch
              label="Autoplay song on load"
              checked={state.layout.autoplay}
              onChange={(v) => actions.setLayout((l) => ({ ...l, autoplay: v }))}
            />
            <ToggleSwitch
              label="Show Top 8 on load"
              checked={state.layout.showTop8}
              onChange={(v) => actions.setLayout((l) => ({ ...l, showTop8: v }))}
            />
            <ToggleSwitch
              label="Wall visibility"
              checked={state.layout.wallVisible}
              onChange={(v) => actions.setLayout((l) => ({ ...l, wallVisible: v }))}
            />
          </div>
        </div>

        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Palette}>Theme variables</SectionHeading>
          <div className="p-3 flex flex-col gap-2">
            {[
              ['accent', 'Accent'],
              ['bg', 'Background'],
              ['text', 'Text'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm font-semibold">
                {label}
                <input
                  type="color"
                  value={state.themeVars[key]}
                  onChange={(e) => actions.setThemeVars((v) => ({ ...v, [key]: e.target.value }))}
                  className="w-10 h-8 border-2 border-black cursor-pointer bg-transparent"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Sparkles}>Badges</SectionHeading>
          <div className="p-3 flex flex-col gap-2">
            {BADGES.map((b) => {
              const owned = state.ownedBadges.some((o) => o.id === b.id);
              return (
                <div key={b.id} className="flex items-center gap-2 border-2 border-black p-2">
                  <b.icon size={14} className="text-spark shrink-0" />
                  <span className="text-xs font-bold flex-1">{b.name}</span>
                  <button
                    onClick={() => actions.buyBadge(b)}
                    disabled={owned || state.sparks < b.price}
                    className={`text-[10px] font-bold uppercase border-2 border-black px-2 py-1 flex items-center gap-1 ${
                      owned
                        ? 'bg-green-400'
                        : state.sparks < b.price
                        ? 'bg-black/10 text-black/30 cursor-not-allowed'
                        : 'bg-spark hover:bg-black hover:text-cream'
                    }`}
                  >
                    {owned ? (
                      <>
                        <Check size={10} /> Owned
                      </>
                    ) : (
                      <>
                        <Zap size={10} /> {b.price}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Palette}>Sandboxed CSS editor</SectionHeading>
          <div className="p-3 flex flex-col gap-2">
            <p className="text-[10px] text-black/50">
              Rules are scoped to <code>.user-space-scope</code> before they touch the page — nothing here can leak
              past your Space.
            </p>
            <textarea
              value={draftCss}
              onChange={(e) => handleDraftChange(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full border-2 border-black p-2 text-xs font-mono resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={liveApply}
                  onChange={(e) => setLiveApply(e.target.checked)}
                  className="accent-black w-3.5 h-3.5"
                />
                Apply live
              </label>
              <div className="flex gap-2">
                <button
                  onClick={resetCss}
                  className="border-2 border-black px-2 py-1 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-black/5"
                >
                  <RefreshCcw size={11} /> Reset
                </button>
                {!liveApply && (
                  <button
                    onClick={applyNow}
                    className="border-2 border-black bg-spark px-2 py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-cream"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-2 border-black bg-white">
          <SectionHeading icon={Sparkles}>Live preview</SectionHeading>
          <div
            className="user-space-scope p-4"
            style={{ '--accent': state.themeVars.accent, '--bg': state.themeVars.bg, '--text': state.themeVars.text }}
          >
            <style>{scopeCss(state.appliedCss)}</style>
            <div
              className="space-card border-2 border-black p-3"
              style={{ backgroundColor: state.themeVars.bg, color: state.themeVars.text }}
            >
              <p className="font-black text-sm">Nova Wave</p>
              <p className="text-xs italic mt-1">&ldquo;{state.mood}&rdquo;</p>
              <button className="space-btn mt-3 border-2 border-black px-3 py-1.5 text-[10px] font-bold uppercase">
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header / Sparks pill                                                 */
/* ------------------------------------------------------------------ */

function SparksPill({ sparks, delta }) {
  return (
    <div className="relative">
      <div className="border-2 border-black bg-black text-cream px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold">
        <Zap size={13} className="text-spark" fill="#FF4F00" />
        {sparks} Sparks
      </div>
      {delta && (
        <span
          key={delta.id}
          className="absolute -top-4 right-1 text-[11px] font-black animate-float-up pointer-events-none"
          style={{ color: delta.value < 0 ? '#FF4F00' : '#111111' }}
        >
          {delta.value > 0 ? '+' : ''}
          {delta.value}
        </span>
      )}
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'home', label: 'Your Space', icon: HomeIcon },
  { id: 'artist', label: 'Artist Page', icon: User },
  { id: 'customize', label: 'Customize', icon: Palette },
];

function Header({ board, setBoard, sparks, delta }) {
  return (
    <header className="border-b-2 border-black bg-cream sticky top-0 z-10">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-1.5 font-black text-lg tracking-tight shrink-0">
          SPACES
          <span className="w-2 h-2 bg-spark inline-block" />
        </div>

        <nav className="flex border-2 border-black">
          {NAV_ITEMS.map((n, i) => (
            <button
              key={n.id}
              onClick={() => setBoard(n.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                i !== 0 ? 'border-l-2 border-black' : ''
              } ${board === n.id ? 'bg-black text-cream' : 'bg-cream hover:bg-black/5'}`}
            >
              <n.icon size={13} />
              <span className="hidden sm:inline">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SparksPill sparks={sparks} delta={delta} />
          <div
            className="w-8 h-8 border-2 border-black flex items-center justify-center text-[10px] font-black shrink-0"
            style={{ backgroundColor: CURRENT_USER.color }}
          >
            {CURRENT_USER.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */

export default function App() {
  const [board, setBoard] = useState('home');
  const [sparks, setSparks] = useState(240);
  const [delta, setDelta] = useState(null);
  const deltaTimeout = useRef(null);

  const [mood, setMood] = useState('currently obsessed with side-chain compression 🎛️');
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [ownedBadges, setOwnedBadges] = useState([]);

  const [layout, setLayout] = useState({ autoplay: false, showTop8: true, wallVisible: true });
  const [themeVars, setThemeVars] = useState({ accent: '#FF4F00', bg: '#FDFBF7', text: '#111111' });
  const [appliedCss, setAppliedCss] = useState(DEFAULT_RAW_CSS);

  const spend = (amount, label) => {
    setSparks((s) => Math.max(0, s - amount));
    setDelta({ value: -amount, id: Date.now(), label });
    clearTimeout(deltaTimeout.current);
    deltaTimeout.current = setTimeout(() => setDelta(null), 1300);
  };

  const buyBadge = (badge) => {
    if (ownedBadges.some((b) => b.id === badge.id) || sparks < badge.price) return;
    spend(badge.price, badge.name);
    setOwnedBadges((b) => [...b, badge]);
  };

  const addComment = (text) => {
    setComments((c) => [{ id: `c${Date.now()}`, author: CURRENT_USER.name, timestamp: 'just now', text }, ...c]);
  };

  useEffect(() => () => clearTimeout(deltaTimeout.current), []);

  const homeState = { mood, comments, ownedBadges, layout, themeVars, appliedCss };
  const homeActions = { setMood, addComment };

  const customizeState = { layout, themeVars, ownedBadges, appliedCss, mood, sparks };
  const customizeActions = { setLayout, setThemeVars, setAppliedCss, buyBadge };

  return (
    <div className="min-h-screen bg-cream text-ink font-mono">
      <Header board={board} setBoard={setBoard} sparks={sparks} delta={delta} />
      {board === 'home' && <HomeBoard state={homeState} actions={homeActions} />}
      {board === 'artist' && <ArtistBoard sparks={sparks} onSpend={spend} />}
      {board === 'customize' && <CustomizeBoard state={customizeState} actions={customizeActions} />}
    </div>
  );
}
