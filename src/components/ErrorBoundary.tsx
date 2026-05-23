"use client";

import {
  Component,
  type ReactNode,
  type ErrorInfo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Override the default crash UI with your own. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

/**
 * Catches render-time errors anywhere in the subtree and shows a
 * French-language recovery screen instead of a blank page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyPage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ReFramed] Erreur non gérée:", error.message, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const msg = this.state.error?.message ?? "Erreur inconnue";

    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="text-5xl" aria-hidden>😵</span>

        <div className="space-y-2">
          <h2 className="text-2xl font-black">Aïe, ça a planté</h2>
          <p className="text-sm text-white/50 break-words">{msg}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium active:scale-[0.98]"
            onClick={() => { window.location.href = "/lobby"; }}
          >
            Retour au lobby
          </button>
          <button
            className="flex-1 rounded-2xl bg-primary px-5 py-3 text-sm font-bold shadow-glow active:scale-[0.98]"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        </div>
      </main>
    );
  }
}
