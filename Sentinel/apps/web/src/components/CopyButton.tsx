import { useState } from "react";

export function CopyButton({
  value,
  label = "Copy",
}: {
  readonly value: string;
  readonly label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-border-hairline px-2 py-1 text-xs font-medium text-ink-secondary hover:border-border-emphasis hover:text-ink-primary"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
