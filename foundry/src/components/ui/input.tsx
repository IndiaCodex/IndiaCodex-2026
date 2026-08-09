"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/ui/form-field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, hint, error, id, required, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const control = (
      <input
        id={inputId}
        type={type}
        required={required}
        className={cn("form-control", error && "form-control--error", className)}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
    );

    if (label) {
      return (
        <FormField
          label={label}
          htmlFor={inputId}
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
Input.displayName = "Input";

export { Input };