"use client";

import { useState, useEffect } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
}

export function ImageWithFallback({ src, alt, className, fallbackText = "No disponible", ...props }: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src || !isLoading || hasError) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
      setHasError(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [src, isLoading, hasError]);

  return (
    <div className={clsx("relative flex items-center justify-center bg-graphite-600/60 overflow-hidden", className)}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/20" />
        </div>
      )}

      {/* Error / Fallback State */}
      {hasError || !src ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <ImageOff size={32} className="text-white opacity-20" />
          <span className="text-xs font-medium text-white/30 uppercase tracking-wider">{fallbackText}</span>
        </div>
      ) : null}

      {/* Actual Image */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={clsx(
            "w-full h-full object-cover transition-all duration-500",
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100",
            className // Permitimos sobreescribir object-cover/contain mediante className en props pero conservamos las bases
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </div>
  );
}
