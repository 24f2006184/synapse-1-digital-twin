import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "bg-accent text-background hover:bg-accent/90 hover:shadow-glow",
        outline: "border border-surface-3 text-slate-300 hover:border-accent/50 hover:text-accent",
        ghost: "text-slate-400 hover:text-slate-200 hover:bg-surface-2",
        danger: "bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20",
        warning: "bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20",
        success: "bg-success/10 border border-success/30 text-success hover:bg-success/20",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-base",
        icon: "w-8 h-8 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";
