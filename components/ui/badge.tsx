import * as React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "pro" | "success" | "danger" | "warning" | "outline";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-graphite-600 text-snow border border-graphite-500",
    pro: "bg-gradient-to-r from-sky-signal-from/20 to-sky-signal-to/20 text-sky-signal-from border border-sky-signal-from/30",
    success:
      "bg-mint-signal/10 text-mint-signal border border-mint-signal/30",
    danger:
      "bg-ember-red/10 text-ember-red border border-ember-red/30",
    warning:
      "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    outline:
      "bg-transparent text-slate-200 border border-graphite-500",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium tracking-wide rounded-[6px]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
