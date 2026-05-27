"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  eventId: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack, label: this.props.label },
    });
    this.setState({ eventId });
  }

  handleReset = () => {
    this.setState({ hasError: false, eventId: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <AlertTriangle size={32} className="text-amber-400" />
          <div>
            <p className="font-semibold text-white">Algo salió mal</p>
            <p className="mt-1 text-sm text-white/50">
              El equipo ha sido notificado automáticamente.
            </p>
            {this.state.eventId && (
              <p className="mt-1 font-mono text-xs text-white/30">
                ID: {this.state.eventId}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <RefreshCw size={14} />
            Intentar de nuevo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Versiones específicas con labels predefinidos
export function CheckoutErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary label="checkout" fallback={
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-950/20 p-8 text-center">
        <AlertTriangle size={32} className="text-red-400" />
        <div>
          <p className="font-semibold text-white">Error en el proceso de pago</p>
          <p className="mt-1 text-sm text-white/50">
            Por favor, recarga la página o contacta con soporte si el problema persiste.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30"
        >
          <RefreshCw size={14} />
          Recargar página
        </button>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
}

export function CartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary label="cart">
      {children}
    </ErrorBoundary>
  );
}

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary label="auth" fallback={
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <AlertTriangle size={32} className="text-amber-400" />
        <div>
          <p className="font-semibold text-white">Error de autenticación</p>
          <p className="mt-1 text-sm text-white/50">
            Recarga la página e intenta de nuevo.
          </p>
        </div>
        <a
          href="/login"
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          Ir al inicio de sesión
        </a>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
}
