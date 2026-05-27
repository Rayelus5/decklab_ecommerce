import React from "react";
import { cn } from "@/components/ui/button";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "status";
}

function Badge({ className, variant = "status", ...props }: BadgeProps) {
  
  const variants = {
    "status": "bg-midnight-abyss text-arctic-mist rounded-[6px] border border-[rgba(186,215,247,0.14)] px-2 py-1 text-caption",
    "default": "bg-white/10 text-ghost-white rounded-[6px] px-2 py-1 text-caption"
  };

  return (
    <div className={cn("inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props} />
  );
}

export { Badge };
