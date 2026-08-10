"use client";

import { Component, type ReactNode } from "react";

/**
 * Contains a render error to its own subtree so one broken component can never blank the whole
 * page (AGENT.md §0.1 — the demo screen never blanks).
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="rounded-xl border border-danger/40 bg-surface p-4 text-sm text-danger">
          {this.props.label ?? "This panel"} hit an error and was isolated. The rest of the demo
          keeps running.
        </div>
      );
    }
    return this.props.children;
  }
}
