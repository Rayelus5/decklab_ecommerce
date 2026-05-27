import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number; // percentage
    label: string;
  };
  accent?: "default" | "amber" | "mint" | "blue" | "red";
}

const ACCENT_STYLES = {
  default: "bg-graphite-700/40 border-white/8",
  amber: "bg-amber-500/6 border-amber-500/20",
  mint: "bg-mint-signal/6 border-mint-signal/20",
  blue: "bg-blue-500/6 border-blue-500/20",
  red: "bg-ember-red/6 border-ember-red/20",
};

const ICON_STYLES = {
  default: "bg-graphite-600/60 text-slate-300",
  amber: "bg-amber-500/15 text-amber-400",
  mint: "bg-mint-signal/15 text-mint-signal",
  blue: "bg-blue-500/15 text-blue-400",
  red: "bg-ember-red/15 text-ember-red",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "default",
}: StatsCardProps) {
  return (
    <div
      className={`rounded-[14px] border p-5 flex flex-col gap-3 ${ACCENT_STYLES[accent]}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs text-slate-300 font-medium">{title}</p>
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${ICON_STYLES[accent]}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-snow tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-300/70 mt-0.5">{subtitle}</p>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={`text-xs font-medium ${
              trend.value >= 0 ? "text-mint-signal" : "text-ember-red"
            }`}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-slate-300/60">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
