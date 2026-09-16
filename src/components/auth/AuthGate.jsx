import { createContext, useContext, useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useProfileById } from '../../hooks/useSpacesQueries';
import { useSessionStore } from '../../stores/sessionStore';
import AuthForm from './AuthForm';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthGate>');
  return ctx;
}

function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-6 font-mono">
      <div className="max-w-lg border-2 border-black bg-white p-6">
        <div className="mb-4 flex items-center gap-1.5 text-xl font-black tracking-tight">
          R'SPACE
          <span className="inline-block h-2 w-2 bg-spark" />
        </div>
        <h1 className="mb-2 text-sm font-black uppercase tracking-wide">Connect Supabase to go live</h1>
        <p className="mb-3 text-xs leading-relaxed text-black/70">
          Every screen in this app is wired against a real Supabase backend — Postgres, Row Level Security,
          Realtime, and Storage — but this environment has no <code className="font-bold">VITE_SUPABASE_URL</code>{' '}
          / <code className="font-bold">VITE_SUPABASE_ANON_KEY</code> configured yet. That's an infrastructure
          step only you can do (it needs your own cloud credentials), not a bug in the code.
        </p>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-black/70">
          <li>Create a free project at supabase.com (or self-host).</li>
          <li>
            Run the SQL in <code className="font-bold">supabase/migrations/</code> against it (SQL editor, or{' '}
            <code className="font-bold">supabase db push</code>).
          </li>
          <li>
            Copy <code className="font-bold">.env.example</code> to <code className="font-bold">.env</code> and
            fill in your project URL + anon key.
          </li>
          <li>Restart the dev server.</li>
        </ol>
        <p className="mt-3 text-[10px] uppercase tracking-wide text-black/40">Full walkthrough in README.md</p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50">
        <Radio className="animate-pulse" size={14} /> Loading Space...
      </div>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = resolving, null = signed out
  const setProfileCache = useSessionStore((s) => s.setProfile);
  const clearSessionCache = useSessionStore((s) => s.clear);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;
  const profileQuery = useProfileById(userId);

  useEffect(() => {
    if (profileQuery.data) setProfileCache(profileQuery.data);
  }, [profileQuery.data, setProfileCache]);

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (session === undefined) return <LoadingScreen />;
  if (session === null) return <AuthForm />;
  if (profileQuery.isLoading) return <LoadingScreen />;
  if (profileQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-6 text-center">
        <p className="text-xs font-bold text-red-600">Could not load your profile: {profileQuery.error.message}</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile: profileQuery.data,
        signOut: async () => {
          await supabase.auth.signOut();
          clearSessionCache();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
