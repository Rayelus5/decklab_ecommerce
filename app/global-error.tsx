"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          backgroundColor: "#050608",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            padding: "2rem",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          {/* Icono */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <AlertTriangle size={24} color="#f87171" />
          </div>

          {/* Texto */}
          <h1
            style={{
              color: "#f8fafc",
              fontSize: "1.25rem",
              fontWeight: 600,
              margin: "0 0 0.5rem",
            }}
          >
            Error inesperado
          </h1>
          <p
            style={{
              color: "rgba(148,163,184,0.8)",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              margin: "0 0 1.5rem",
            }}
          >
            Algo salió mal. El equipo ha sido notificado automáticamente.
            {error.digest && (
              <>
                <br />
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.5 }}>
                  ID: {error.digest}
                </span>
              </>
            )}
          </p>

          {/* Acciones */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.25rem",
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#f8fafc",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
             className="cursor-pointer">
              <RefreshCw size={14} />
              Intentar de nuevo
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.25rem",
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(148,163,184,0.9)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
             className="cursor-pointer">
              Volver al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
