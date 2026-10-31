import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// CMMI design system v3 (locked 2026-10-31): capsule shape, tactile soft shadows,
// pressed-in active state, Apple easing, minimum 44px default touch target.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(.32,.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-tactile hover:bg-marine-deep active:shadow-tactile-pressed",
        destructive:
          "bg-destructive text-destructive-foreground shadow-tactile hover:bg-[#992C25] active:shadow-tactile-pressed",
        outline:
          "border border-input bg-card shadow-soft hover:bg-accent hover:text-accent-foreground active:shadow-tactile-pressed",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:bg-[#DCE9F3] active:shadow-tactile-pressed",
        ghost: "hover:bg-accent hover:text-accent-foreground active:shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:translate-y-0",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
