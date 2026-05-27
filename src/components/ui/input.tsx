import React from "react";
import { cn } from "@/components/ui/button";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full",
          "bg-[rgba(199,211,234,0.06)]",
          "border border-[rgba(186,215,247,0.14)]",
          "rounded-[6px]",
          "px-3 py-0",
          "text-body text-ghost-white",
          "placeholder:text-whisper-blue",
          "transition-colors duration-150",
          "focus-visible:outline-none",
          "focus-visible:border-celestial-light focus-visible:ring-1 focus-visible:ring-celestial-light/30",
          "hover:border-[rgba(186,215,247,0.24)]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
