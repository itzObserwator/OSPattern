"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({children, className = ""}: {children: React.ReactNode; className?: string}) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="bos-overlay"/><DialogPrimitive.Content className={`bos-dialog ${className}`}>
    <div className="bos-dialog-ornament" aria-hidden="true"><span/><span/></div>{children}<DialogPrimitive.Close className="bos-dialog-close bos-button bos-ghost bos-icon-button" aria-label="Close dialog"><X size={18}/></DialogPrimitive.Close>
  </DialogPrimitive.Content></DialogPrimitive.Portal>;
}
