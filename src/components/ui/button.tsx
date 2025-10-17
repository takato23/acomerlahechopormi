/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-custom focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-custom shadow-custom hover:shadow-custom-md hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground rounded-custom shadow-custom hover:shadow-custom-md hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border border-border bg-background rounded-custom hover:bg-muted/50 hover:border-border/80 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground rounded-custom shadow-custom hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-muted/50 rounded-custom active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        minimal: "hover:opacity-70 transition-opacity active:opacity-50",
        gradient: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-custom shadow-custom hover:shadow-custom-md hover:from-primary/90 hover:to-primary/70 active:scale-[0.98]",
        glass: "bg-background/80 backdrop-blur-glass border border-border/40 text-foreground rounded-custom shadow-custom hover:bg-background/90 hover:border-border/60 active:scale-[0.98]",
        studio:
          "rounded-[18px] bg-gradient-primary text-primary-foreground shadow-xl shadow-[0_22px_45px_rgba(93,42,66,0.18)] hover:shadow-[0_28px_60px_rgba(93,42,66,0.24)] hover:brightness-[1.05] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        xs: "h-6 rounded-custom px-2 text-xs",
        sm: "h-8 rounded-custom px-3 text-xs",
        lg: "h-12 rounded-custom px-8 text-base",
        icon: "h-10 w-10 rounded-custom",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
