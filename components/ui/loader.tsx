"use client";

import { Loader2 } from "lucide-react";

// Spinner genérico (Lucide, safe para SSR)
export function Spinner({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-current ${className}`}
      aria-hidden="true"
    />
  );
}

// Skeleton genérico
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/8 ${className}`}
      aria-hidden="true"
    />
  );
}

// Skeleton de tarjeta de producto
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/8 bg-graphite-700/40 overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Skeleton de fila de pedido
export function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Loader de página completa (para Suspense boundaries)
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Spinner size={32} className="text-white/30" />
    </div>
  );
}

// Loader específico para botones de pago (mayor tamaño)
export function PaymentLoader() {
  return (
    <span className="flex items-center gap-2">
      <Spinner size={16} />
      Procesando...
    </span>
  );
}
