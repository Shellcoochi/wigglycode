import * as React from "react";
import { cn } from "@/lib/utils";

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        className={cn(
          "h-8 w-full rounded border border-border bg-background px-2 text-sm outline-none",
          "focus:ring-2 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

TextInput.displayName = "TextInput";
