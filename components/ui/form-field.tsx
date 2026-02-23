import * as React from "react";
import { Label } from "./label";
import { Input, type InputProps } from "./input";
import { cn } from "@/lib/utils";

// ─── FormField ────────────────────────────────────────────────
// Groups a Label + Input + optional helper/error text.
// This is the unit you reach for when building any form.
//
// USAGE:
//   <FormField
//     id="email"
//     label="Email"
//     type="email"
//     placeholder="you@example.com"
//     required
//   />
//
//   With error:
//   <FormField
//     id="rent"
//     label="Rent Amount"
//     type="number"
//     error
//     errorMessage="Rent must be greater than 0"
//   />
//
// ASCII FLOW:
//   <FormField>
//   ├── <Label>     ← label + optional *
//   ├── <Input>     ← styled input (red border when error=true)
//   └── <p>         ← helper or error message
// ─────────────────────────────────────────────────────────────

export interface FormFieldProps extends InputProps {
  /** Text shown above the input */
  label: string;
  /** HTML id — connects label's htmlFor to input's id */
  id: string;
  /** Text shown below the input when no error */
  helper?: string;
  /** When provided, renders in red below the input */
  errorMessage?: string;
  /** Wrapper div className */
  wrapperClassName?: string;
}

function FormField({
  label,
  id,
  helper,
  errorMessage,
  wrapperClassName,
  required,
  error,
  className,
  ...inputProps
}: FormFieldProps) {
  const hasError = !!errorMessage || error;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      <Input
        id={id}
        error={hasError}
        required={required}
        className={className}
        aria-describedby={
          errorMessage ? `${id}-error` : helper ? `${id}-helper` : undefined
        }
        {...inputProps}
      />

      {errorMessage ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
