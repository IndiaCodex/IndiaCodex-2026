"use client";

export function Button({
  children,
  onClick,
  tone = "default",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "default" | "accent" | "danger";
  disabled?: boolean;
}) {
  const toneClass = {
    default: "bg-surface2 text-text hover:bg-border",
    accent: "bg-accent text-bg hover:opacity-90",
    danger: "bg-danger/20 text-danger hover:bg-danger/30",
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}
