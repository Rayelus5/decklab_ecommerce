import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Loader from "@/components/ui/loader";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary-pill" | "secondary-outline" | "solid-primary" | "icon";
  size?: "default" | "icon" | "sm" | "lg";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary-pill", size = "default", isLoading = false, children, disabled, ...props }, ref) => {

    const variants = {
      "primary-pill": [
        "bg-[rgba(186,214,247,0.07)] text-ghost-white",
        "border border-[rgba(186,215,247,0.18)]",
        "hover:bg-[rgba(186,214,247,0.13)] hover:border-[rgba(186,215,247,0.32)]",
        "rounded-pill",
      ].join(" "),

      "secondary-outline": [
        "bg-transparent text-arctic-mist",
        "border border-[rgba(186,215,247,0.22)]",
        "hover:bg-[rgba(186,214,247,0.06)] hover:border-[rgba(186,215,247,0.38)] hover:text-ghost-white",
        "rounded-pill",
      ].join(" "),

      "solid-primary": [
        "bg-neon-violet text-white",
        "border border-neon-violet/30",
        "hover:bg-[#7a52f5]",
        "rounded-md",
        "shadow-[0_0_18px_rgba(102,58,243,0.35)]",
        "hover:shadow-[0_0_28px_rgba(102,58,243,0.55)]",
      ].join(" "),

      "icon": [
        "bg-transparent text-ghost-white",
        "border border-[rgba(186,215,247,0.15)]",
        "hover:bg-[rgba(186,214,247,0.07)] hover:border-[rgba(186,215,247,0.28)]",
        "rounded-pill",
      ].join(" "),
    };

    const sizes = {
      default: "h-9 px-4 text-body",
      icon: "h-9 w-9 flex items-center justify-center",
      sm: "h-8 px-3 text-caption",
      lg: "h-11 px-6 text-body-lg",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celestial-light focus-visible:ring-offset-1 focus-visible:ring-offset-midnight-abyss",
          "disabled:pointer-events-none disabled:opacity-40",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Loader size={18} color={variant === "solid-primary" ? "white" : "var(--color-celestial-light)"} />
          </span>
        )}
        <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
          {children}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, cn };
