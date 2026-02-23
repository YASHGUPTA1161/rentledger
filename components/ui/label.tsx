import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Label ────────────────────────────────────────────────────
// Styled <label> for form fields.
//
// USAGE:
//   <Label htmlFor="email">Email</Label>
//   <Input id="email" type="email" />
//
//   Or with required indicator:
//   <Label htmlFor="rent" required>Rent Amount</Label>
// ─────────────────────────────────────────────────────────────

export interface LabelProps extends React.ComponentProps<"label"> {
  required?: boolean;
}

function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block text-sm font-medium leading-none text-foreground",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export { Label };
