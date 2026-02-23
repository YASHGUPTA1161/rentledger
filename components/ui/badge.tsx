import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Badge ────────────────────────────────────────────────────
// Small coloured label. Used for statuses, tags, counts.
//
// USAGE:
//   <Badge>Active</Badge>
//   <Badge variant="destructive">Overdue</Badge>
//   <Badge variant="success">Verified</Badge>
//   <Badge variant="warning">Pending</Badge>
//   <Badge variant="outline">Draft</Badge>
//
// VARIANTS:
//   default     → indigo/primary
//   secondary   → grey
//   destructive → red
//   outline     → transparent with border
//   success     → green  (custom, specific to rentledger)
//   warning     → amber  (custom, specific to rentledger)
// ─────────────────────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/80",
        outline: "border-current text-foreground",
        // ─ App-specific variants ────────────────────────────
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        info: "border-transparent bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
