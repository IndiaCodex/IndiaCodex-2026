import type { ReactNode } from "react";
import { ApiError } from "../lib/api-client.js";

export function LoadingState({ label = "Loading…" }: { readonly label?: string }) {
  return <p className="px-4 py-8 text-center text-sm text-ink-muted">{label}</p>;
}

export function ErrorState({ error }: { readonly error: unknown }) {
  const message = error instanceof ApiError ? `${error.code}: ${error.message}` : String(error);
  return (
    <div className="rounded-lg border border-status-critical/30 bg-status-critical/10 px-4 py-3 text-sm text-status-critical">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { readonly message: string }) {
  return <p className="px-4 py-8 text-center text-sm text-ink-muted">{message}</p>;
}

export function QueryBoundary({
  isLoading,
  error,
  isEmpty,
  emptyMessage = "Nothing here yet.",
  children,
}: {
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly isEmpty?: boolean;
  readonly emptyMessage?: string;
  readonly children: ReactNode;
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (isEmpty) return <EmptyState message={emptyMessage} />;
  return <>{children}</>;
}
