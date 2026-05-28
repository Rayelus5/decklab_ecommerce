"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  closesAt: Date | string;
  className?: string;
  compact?: boolean; // true = solo HH:MM:SS sin etiquetas
}

function getTimeLeft(closesAt: Date | string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export function CountdownTimer({ closesAt, className = "", compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(closesAt));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(closesAt));
    }, 1000);
    return () => clearInterval(id);
  }, [closesAt]);

  if (!timeLeft) {
    return <span className={className}>Reserva cerrada</span>;
  }

  if (compact) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dd = String(timeLeft.days);
    const hh = pad(timeLeft.hours);
    const mm = pad(timeLeft.minutes);
    const ss = pad(timeLeft.seconds);
    return (
      <span className={`font-mono tabular-nums ${className}`}>
        {timeLeft.days > 0 && <>{dd}d </>}
        {hh}:{mm}:{ss}
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {timeLeft.days > 0 && (
        <Unit value={pad(timeLeft.days)} label="d" />
      )}
      <Unit value={pad(timeLeft.hours)} label="h" />
      <Sep />
      <Unit value={pad(timeLeft.minutes)} label="m" />
      <Sep />
      <Unit value={pad(timeLeft.seconds)} label="s" />
    </div>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="font-mono tabular-nums text-snow font-semibold">{value}</span>
      <span className="text-slate-400 text-xs">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="text-slate-400 font-mono leading-none -mt-0.5">:</span>;
}
