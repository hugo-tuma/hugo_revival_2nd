export default function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6 font-sans">
      <div className="max-w-lg border border-black bg-white p-6">
        <div className="mb-4 flex items-center gap-1.5 font-mono text-lg font-semibold">
          R&rsquo;SPACE
          <span className="inline-block h-2 w-2 bg-black" />
        </div>
        <h1 className="mb-2 text-sm font-bold uppercase tracking-wide">Connect Supabase to go live</h1>
        <p className="mb-3 text-xs leading-relaxed text-neutral-600">
          Every view here reads from a real Supabase backend — Postgres, Row Level Security, and two
          privacy-preserving public views for Sparks earnings — but this environment has no{' '}
          <code className="font-semibold">VITE_SUPABASE_URL</code> /{' '}
          <code className="font-semibold">VITE_SUPABASE_ANON_KEY</code> configured yet. That&rsquo;s an
          infrastructure step only you can do, not a bug in the code.
        </p>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-neutral-600">
          <li>Create a Supabase project (or use an existing one).</li>
          <li>
            Run the SQL in <code className="font-semibold">supabase/migrations/</code>, in order, against it.
          </li>
          <li>
            Run <code className="font-semibold">supabase/seed.sql</code> to populate it with a full demo
            community.
          </li>
          <li>
            Copy <code className="font-semibold">.env.example</code> to <code className="font-semibold">.env</code>{' '}
            and fill in your project URL + anon key.
          </li>
          <li>Restart the dev server.</li>
        </ol>
        <p className="mt-3 text-[10px] uppercase tracking-wide text-neutral-400">
          Full walkthrough in README.md
        </p>
      </div>
    </div>
  );
}
