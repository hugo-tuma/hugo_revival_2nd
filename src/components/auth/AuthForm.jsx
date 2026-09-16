import { useState } from 'react';
import { Loader2, Mic2, Radio, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthForm() {
  const [mode, setMode] = useState('sign_in');
  const [role, setRole] = useState('listener');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'sign_in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || 'New Space', role } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice('Check your inbox to confirm your email, then sign in.');
          setMode('sign_in');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-6 font-mono">
      <div className="w-full max-w-sm border-2 border-black bg-white p-6">
        <div className="mb-5 flex items-center gap-1.5 text-xl font-black tracking-tight">
          R'SPACE
          <span className="inline-block h-2 w-2 bg-spark" />
        </div>

        <div className="mb-4 flex border-2 border-black">
          <button
            type="button"
            onClick={() => setMode('sign_in')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase ${mode === 'sign_in' ? 'bg-black text-cream' : ''}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('sign_up')}
            className={`flex-1 border-l-2 border-black py-1.5 text-xs font-bold uppercase ${
              mode === 'sign_up' ? 'bg-black text-cream' : ''
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2">
          {mode === 'sign_up' && (
            <>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="border-2 border-black px-2 py-1.5 text-sm"
                required
              />

              <div className="flex border-2 border-black">
                <button
                  type="button"
                  onClick={() => setRole('listener')}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 text-xs font-bold uppercase ${
                    role === 'listener' ? 'bg-black text-cream' : 'hover:bg-black/5'
                  }`}
                >
                  <User size={12} /> Listener
                </button>
                <button
                  type="button"
                  onClick={() => setRole('artist')}
                  className={`flex flex-1 items-center justify-center gap-1.5 border-l-2 border-black py-1.5 text-xs font-bold uppercase ${
                    role === 'artist' ? 'bg-black text-cream' : 'hover:bg-black/5'
                  }`}
                >
                  <Mic2 size={12} /> Artist
                </button>
              </div>
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border-2 border-black px-2 py-1.5 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            minLength={6}
            className="border-2 border-black px-2 py-1.5 text-sm"
            required
          />

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          {notice && (
            <p className="flex items-center gap-1 text-xs font-bold text-black/70">
              <Radio size={12} /> {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex items-center justify-center gap-2 border-2 border-black bg-spark py-2 text-xs font-bold uppercase tracking-wide hover:bg-black hover:text-cream disabled:opacity-50 transition-colors"
          >
            {busy && <Loader2 size={13} className="animate-spin" />}
            {mode === 'sign_in' ? 'Enter your Space' : 'Create your Space'}
          </button>
        </form>
      </div>
    </div>
  );
}
