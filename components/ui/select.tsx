import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Select ───────────────────────────────────────────────────
// Native <select> with consistent styling matching Input.
//
// USAGE:
//   <Select name="paymentMethod">
//     <option value="">Select…</option>
//     <option value="UPI">UPI</option>
//   </Select>
//
//   Or with the SelectOption helper:
//   <Select name="method">
//     {PAYMENT_METHODS.map(o => <SelectOption key={o.value} {...o} />)}
//   </Select>
//
// WHY NATIVE <select>?
//   Radix Select is great for custom dropdowns but adds complexity and
//   accessibility burden. For a landlord app with <10 options per
//   dropdown, native select is faster to ship and easier to maintain.
// ─────────────────────────────────────────────────────────────

export interface SelectProps extends React.ComponentProps<"select"> {
  error?: boolean;
}

function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs",
        "transition-colors outline-none cursor-pointer",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-destructive ring-destructive/20" : "border-input",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── SelectOption ─────────────────────────────────────────────
// Thin wrapper so you can pass a typed option object from a constant array.
// USAGE: <SelectOption value="UPI" label="UPI" />

export interface SelectOptionProps extends React.ComponentProps<"option"> {
  label: string;
}

function SelectOption({ label, value, ...props }: SelectOptionProps) {
  return (
    <option value={value} {...props}>
      {label}
    </option>
  );
}

export { Select, SelectOption };
