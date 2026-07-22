import type { ReactNode } from "react";

export function Mono({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <span className={`font-mono-ui text-[13px] ${className}`}>{children}</span>;
}
