import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css as cssLang } from '@codemirror/lang-css';
import { linter, lintGutter } from '@codemirror/lint';
import { RefreshCcw, ShieldCheck } from 'lucide-react';
import { sanitizeAndScopeCss } from '../../lib/cssSandbox';
import SectionHeading from '../ui/SectionHeading';

const DEFAULT_RAW_CSS = `.space-card {
  border-color: var(--accent);
}
.space-btn {
  background: var(--accent);
  color: var(--bg);
}`;

const PERSIST_DEBOUNCE_MS = 700;

function makeCssLinter(scopeSuffix) {
  return linter((view) => {
    const doc = view.state.doc;
    const { diagnostics } = sanitizeAndScopeCss(doc.toString(), { scopeSuffix });
    const clampLine = (l) => Math.min(Math.max(l, 1), doc.lines);

    return diagnostics.map((d) => {
      const lineInfo = doc.line(clampLine(d.line));
      const from = Math.min(lineInfo.from + Math.max(0, d.column - 1), doc.length);
      const endLineInfo = doc.line(clampLine(d.endLine));
      let to = Math.min(endLineInfo.from + Math.max(0, d.endColumn - 1), doc.length);
      if (to <= from) to = Math.min(from + 1, doc.length);
      return { from, to, severity: d.severity === 'error' ? 'error' : 'warning', message: d.message };
    });
  });
}

/**
 * The editor's own preview always updates on every keystroke, purely
 * client-side (see onDraftChange) — that's the "instant" part. "Apply live"
 * only controls whether the persisted profile row (what everyone else
 * actually sees) is kept in sync automatically, debounced so typing doesn't
 * fire a database write per character; with it off, persisting waits for
 * the explicit Apply button.
 */
export default function CssEditor({ profile, onDraftChange, onPersist }) {
  const initial = profile.custom_css || DEFAULT_RAW_CSS;
  const [draft, setDraft] = useState(initial);
  const [liveApply, setLiveApply] = useState(true);
  const scopeSuffix = profile.id.slice(0, 8);
  const debounceRef = useRef(null);

  useEffect(() => {
    onDraftChange(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extensions = useMemo(() => [cssLang(), lintGutter(), makeCssLinter(scopeSuffix)], [scopeSuffix]);

  const handleChange = (value) => {
    setDraft(value);
    onDraftChange(value);
    if (liveApply) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onPersist(value), PERSIST_DEBOUNCE_MS);
    }
  };

  const applyNow = () => {
    clearTimeout(debounceRef.current);
    onPersist(draft);
  };

  const resetCss = () => {
    clearTimeout(debounceRef.current);
    setDraft(DEFAULT_RAW_CSS);
    onDraftChange(DEFAULT_RAW_CSS);
    onPersist(DEFAULT_RAW_CSS);
  };

  return (
    <div className="space-card border-2 border-black bg-white">
      <SectionHeading icon={ShieldCheck}>Sandboxed CSS editor</SectionHeading>
      <div className="flex flex-col gap-2 p-3">
        <p className="text-[10px] leading-relaxed text-black/50">
          Parsed with PostCSS + postcss-selector-parser, entirely in your browser. Only{' '}
          <code className="font-bold">.space-card</code>, <code className="font-bold">.space-btn</code>,{' '}
          <code className="font-bold">.space-banner</code> selectors and the{' '}
          <code className="font-bold">--accent</code> / <code className="font-bold">--bg</code> /{' '}
          <code className="font-bold">--text</code> / <code className="font-bold">--font-mono</code> variables are
          allowed — url(), @import, html/body/:root, position:fixed, and stray custom properties are stripped
          before this ever reaches your Space.
        </p>
        <div className="border-2 border-black text-xs">
          <CodeMirror
            value={draft}
            height="220px"
            theme="light"
            extensions={extensions}
            onChange={handleChange}
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={liveApply} onChange={(e) => setLiveApply(e.target.checked)} className="h-3.5 w-3.5 accent-black" />
            Apply live
          </label>
          <div className="flex gap-2">
            <button onClick={resetCss} className="flex items-center gap-1 border-2 border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-black/5">
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
  );
}
