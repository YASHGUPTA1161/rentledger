// ============================================================
// UI Component Library — Barrel Export
// Import EVERYTHING from "@/components/ui"
//
// USAGE (anywhere in the app):
//   import { Button, Badge, Input, Modal, Select } from "@/components/ui";
//
// WHY A BARREL FILE?
//   Without this you'd write 5 separate import lines per file.
//   This keeps imports clean and lets you rename/move components
//   without hunting down every consumer.
// ============================================================

// ─── Existing (shipped with project) ─────────────────────────
export { Button, buttonVariants } from "./button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./card";

// ─── New UI primitives ────────────────────────────────────────
export { Input } from "./input";
export type { InputProps } from "./input";

export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

export { Select, SelectOption } from "./select";
export type { SelectProps, SelectOptionProps } from "./select";

export { Modal, ModalFooter } from "./modal";
export type { ModalProps } from "./modal";

export { Label } from "./label";
export type { LabelProps } from "./label";

export { FormField } from "./form-field";
export type { FormFieldProps } from "./form-field";
