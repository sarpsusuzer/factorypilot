import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Same 28 / 32 / 40 / 50 (sm / md / default / lg) scale as Button and Select.
// `default` is 40 — every bare <Input> follows this unless a size is explicitly given.
const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-background text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
  {
    variants: {
      size: {
        sm: "h-7 px-2 text-[0.8rem] md:text-[0.8rem]",
        md: "h-8 px-2.5",
        default: "h-10 px-3",
        lg: "h-[50px] px-3.5 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
