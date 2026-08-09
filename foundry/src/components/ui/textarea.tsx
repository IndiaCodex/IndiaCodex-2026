"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/ui/form-field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, required, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const control = (
      <textarea
        id={textareaId}
        required={required}
        className={cn(
          "form-control min-h-28 resize-y py-3",
          error && "form-control--error",
          className,
        )}
        ref={ref}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    );

    if (label) {
      return (
        <FormField
          label={label}
          htmlFor={textareaId}
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
Textarea.displayName = "Textarea";

export { Textarea };