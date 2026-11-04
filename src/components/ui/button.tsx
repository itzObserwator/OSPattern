import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(...inputs));
const variants = cva("bos-button", { variants: { variant: { primary: "bos-primary", secondary: "bos-secondary", ghost: "bos-ghost" }, size: { default: "", icon: "bos-icon-button" } }, defaultVariants: {variant: "secondary", size: "default"} });
export function Button({asChild, variant, size, className, ...props}: React.ComponentProps<"button"> & VariantProps<typeof variants> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(variants({variant, size}), className)} {...props} />;
}
