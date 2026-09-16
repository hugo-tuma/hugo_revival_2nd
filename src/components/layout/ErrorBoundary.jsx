import { Component } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("R'SPACE crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-6 font-mono">
        <div className="max-w-md border-2 border-black bg-white p-6 text-center">
          <TriangleAlert className="mx-auto mb-3 text-spark" size={28} />
          <h1 className="mb-1 text-sm font-black uppercase tracking-wide">Something broke</h1>
          <p className="mb-4 text-xs text-black/60">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mx-auto flex items-center gap-2 border-2 border-black bg-spark px-4 py-2 text-xs font-bold uppercase hover:bg-black hover:text-cream transition-colors"
          >
            <RotateCcw size={13} /> Reload
          </button>
        </div>
      </div>
    );
  }
}
