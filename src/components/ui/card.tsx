import React from "react";
import { cn } from "@/components/ui/button";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glassy-feature" | "login-form" | "default";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {

    const variants = {
      "glassy-feature": [
        "bg-[rgba(186,214,247,0.04)]",
        "border border-[rgba(186,215,247,0.12)]",
        "rounded-[12px]",
        "shadow-subtle-4",
        "p-6",
      ].join(" "),

      "login-form": [
        "bg-[rgba(5,6,15,0.97)]",
        "border border-[rgba(186,215,247,0.1)]",
        "rounded-[16px]",
        "shadow-subtle-6",
        "p-8",
      ].join(" "),

      "default": [
        "bg-[rgba(186,214,247,0.04)]",
        "border border-[rgba(186,215,247,0.1)]",
        "rounded-[12px]",
        "shadow-subtle-4",
        "p-6",
        "text-comet",
      ].join(" "),
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-heading-lg font-aeonikpro font-medium leading-none text-ghost-white", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-body text-arctic-mist leading-relaxed", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
