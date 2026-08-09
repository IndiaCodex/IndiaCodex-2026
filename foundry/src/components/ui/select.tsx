"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { FormField } from "@/components/ui/form-field";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, options, placeholder, id, required, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const control = (
      <div className="relative">
        <select
          id={selectId}
          required={required}
          className={cn(
            "form-control appearance-none pr-10",
            error && "form-control--error",
            className,
          )}
          ref={ref}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
      </div>
    );

    if (label) {
      return (
        <FormField
          label={label}
          htmlFor={selectId}
          hint={hint}
          error={error}
          required={required}
        >
          {control}
        </FormField>
      );
    }

    return (
      <div className="space-y-1.5">
        {control}
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };