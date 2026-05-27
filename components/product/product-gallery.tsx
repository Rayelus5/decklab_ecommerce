"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productTitle: string;
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasMultiple = images.length > 1;

  const startAutoScroll = useCallback(() => {
    if (!hasMultiple) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 10000);
  }, [hasMultiple, images.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoScroll]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index);
      startAutoScroll(); // reset timer on manual navigation
    },
    [startAutoScroll]
  );

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + images.length) % images.length);
  }, [activeIndex, images.length, goTo]);

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % images.length);
  }, [activeIndex, images.length, goTo]);

  // Lightbox navigation
  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, lightboxPrev, lightboxNext, closeLightbox]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const currentImage = images[activeIndex];

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image */}
        <div className="relative aspect-square bg-graphite-700/40 border border-white/8 rounded-[16px] overflow-hidden group">
          {currentImage ? (
            <>
              <img
                src={currentImage.url}
                alt={currentImage.alt ?? productTitle}
                className="object-cover w-full h-full transition-opacity duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Zoom button */}
              <button
                onClick={() => openLightbox(activeIndex)}
                className="absolute top-3 right-3 p-2 bg-graphite-800/80 border border-white/10 rounded-[8px] text-slate-300 hover:text-snow opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                aria-label="Ampliar imagen"
              >
                <ZoomIn size={16} />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageOff size={40} className="text-white/10" />
            </div>
          )}

          {/* Prev / Next arrows (only when multiple images) */}
          {hasMultiple && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-graphite-800/80 border border-white/10 rounded-[8px] text-slate-300 hover:text-snow opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-graphite-800/80 border border-white/10 rounded-[8px] text-slate-300 hover:text-snow opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={18} />
              </button>

              {/* Auto-scroll progress dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "w-5 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails (only when multiple images) */}
        {hasMultiple && (
          <div className="grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => goTo(i)}
                aria-label={`Seleccionar imagen ${i + 1}`}
                className={`relative aspect-square rounded-[8px] overflow-hidden border transition-all duration-200 ${
                  i === activeIndex
                    ? "border-white/40 ring-1 ring-white/20"
                    : "border-white/8 hover:border-white/20"
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt ?? `${productTitle} — imagen ${i + 1}`}
                  className="object-cover w-full h-full"
                  sizes="80px"
                />
                {i === activeIndex && (
                  <div className="absolute inset-0 bg-white/5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-[8px] text-snow transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-slate-300 bg-graphite-800/80 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}

          {/* Image container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]?.url}
              alt={images[lightboxIndex]?.alt ?? productTitle}
              className="max-w-full max-h-[90vh] object-contain rounded-[12px] select-none"
              draggable={false}
            />
          </div>

          {/* Prev/Next in lightbox */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-graphite-800/80 border border-white/10 rounded-[10px] text-slate-300 hover:text-snow transition-colors backdrop-blur-sm"
                aria-label="Imagen anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-graphite-800/80 border border-white/10 rounded-[10px] text-slate-300 hover:text-snow transition-colors backdrop-blur-sm"
                aria-label="Imagen siguiente"
              >
                <ChevronRight size={22} />
              </button>

              {/* Thumbnail strip */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto py-1 px-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(i);
                    }}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`shrink-0 w-14 h-14 rounded-[6px] overflow-hidden border transition-all duration-200 ${
                      i === lightboxIndex
                        ? "border-white/50 ring-1 ring-white/30"
                        : "border-white/15 hover:border-white/35 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt ?? `imagen ${i + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
