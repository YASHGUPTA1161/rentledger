import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Input ────────────────────────────────────────────────────
// Drop-in replacement for <input>. Passes all native props through.
//
// USAGE:
//   <Input type="email" placeholder="you@example.com" />
//   <Input type="text" className="w-full" error />   ← red border on error
//
// WHY THIS EXISTS:
//   Centralises the border/focus ring/disabled style so every
//   input in the app looks identical without copy-pasting classes.
// ─────────────────────────────────────────────────────────────

export interface InputProps extends React.ComponentProps<"input"> {
  /** When true, renders a destructive (red) ring — useful for form errors */
  error?: boolean;
}

function Input({ className, error, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs",
        "transition-colors outline-none",
        // Placeholder
        "placeholder:text-muted-foreground",
        // Focus
        "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // File input reset
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Error state
        error
          ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/30"
          : "border-input",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
