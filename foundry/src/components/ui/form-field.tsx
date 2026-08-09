"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required ? <span className="ml-0.5 text-accent">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("space-y-5", className)}>
      <legend className="mb-1 block w-full">
        <span className="font-display text-base font-semibold text-foreground">{title}</span>
        {description ? (
          <span className="mt-1 block text-sm font-normal text-foreground-muted">{description}</span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}