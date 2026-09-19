"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ModuleErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[MorphOS] module crashed:", error);
  }

  componentDidUpdate(prev: Props) {
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="text-rose-300 text-sm font-medium">
            {this.props.fallbackTitle ?? "Module crashed"}
          </div>
          <pre className="text-[11px] text-white/50 max-w-full overflow-auto whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white/80"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
