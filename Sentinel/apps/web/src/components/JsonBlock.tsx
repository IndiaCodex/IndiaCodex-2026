import { CopyButton } from "./CopyButton.js";

export function JsonBlock({
  value,
  maxHeight = "24rem",
}: {
  readonly value: unknown;
  readonly maxHeight?: string;
}) {
  const json = JSON.stringify(value, null, 2);
  return (
    <div className="relative rounded-md border border-border-hairline bg-surface-2">
      <div className="absolute right-2 top-2">
        <CopyButton value={json} label="Copy JSON" />
      </div>
      <pre
        className="overflow-auto p-3 pr-20 font-mono-ui text-[12px] leading-relaxed text-ink-secondary"
        style={{ maxHeight }}
      >
        {json}
      </pre>
    </div>
  );
}
