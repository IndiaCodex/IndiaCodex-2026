"use client";

/** Two-option segmented toggle. */
export function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-muted">{label}</span>}
      <div className="inline-flex rounded-lg border border-border bg-surface2 p-0.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
              value === opt
                ? "bg-accent text-bg"
                : "text-muted hover:text-text"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
