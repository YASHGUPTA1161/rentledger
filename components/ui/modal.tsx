"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Modal ────────────────────────────────────────────────────
// Accessible dialog overlay built on the native <dialog> element.
//
// USAGE:
//   const [open, setOpen] = useState(false);
//
//   <button onClick={() => setOpen(true)}>Open</button>
//
//   <Modal open={open} onClose={() => setOpen(false)} title="Confirm Delete">
//     <p>Are you sure?</p>
//     <ModalFooter>
//       <Button variant="destructive" onClick={handleDelete}>Delete</Button>
//       <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
//     </ModalFooter>
//   </Modal>
//
// WHY native <dialog>?
//   Built-in focus trap + ESC closes + backdrop for free.
//   No external dependency needed.
//
// ASCII FLOW:
//   open=true → useEffect calls dialog.showModal()
//   ESC key   → browser fires 'cancel' → onClose()
//   Backdrop click → onClose()
// ─────────────────────────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Max width of the modal panel. Default: "max-w-md" */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: React.ReactNode;
  className?: string;
}

const sizeMap: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
};

function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  // Sync open state → native dialog API
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // ESC key fires 'cancel' on native dialog — map to onClose
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault(); // let us control close animation if needed
    onClose();
  };

  // Click on the backdrop (the <dialog> element itself, not its child panel)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={cn(
        // Reset browser dialog styles
        "m-auto rounded-xl border bg-background p-0 shadow-xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        "open:animate-in open:fade-in-0 open:zoom-in-95",
        sizeMap[size],
        "w-full",
        className,
      )}
    >
      {/* Panel — stops click propagation so backdrop click works correctly */}
      <div onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between border-b px-6 py-4">
            <div>
              {title && (
                <h2 className="text-base font-semibold leading-none tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </dialog>
  );
}

// ─── ModalFooter ──────────────────────────────────────────────
// Optional footer with right-aligned action buttons.
// USAGE: wrap <Button> elements inside <ModalFooter>

function ModalFooter({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="modal-footer"
      className={cn(
        "flex items-center justify-end gap-2 border-t px-6 py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { Modal, ModalFooter };
