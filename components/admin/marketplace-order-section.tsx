"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_LABEL: Record<string, string> = {
  WALLAPOP: "Wallapop",
  VINTED: "Vinted",
};

const PAY_OPTION_LABEL: Record<string, string> = {
  WEB: "Pagado en web (−1€)",
  PLATFORM: "Pendiente de pago en plataforma",
};

const LISTING_STATUS_LABEL: Record<string, string> = {
  PENDING: "Sin anuncio",
  LISTING_CREATED: "Anuncio creado",
  SOLD: "Vendido",
};

const LISTING_STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  LISTING_CREATED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  SOLD: "text-mint-signal bg-mint-signal/10 border-mint-signal/20",
};

interface MarketplaceOrderSectionProps {
  orderId: string;
  platform: string;
  payOption: string;
  listingUrl: string | null;
  listingStatus: string | null;
  buyerHasTelegram: boolean;
}

export function MarketplaceOrderSection({
  orderId,
  platform,
  payOption,
  listingUrl,
  listingStatus,
  buyerHasTelegram,
}: MarketplaceOrderSectionProps) {
  const router = useRouter();
  const [url, setUrl] = useState(listingUrl ?? "");
  const [loading, setLoading] = useState(false);

  const platformLabel = PLATFORM_LABEL[platform] ?? platform;
  const currentStatus = listingStatus ?? "PENDING";
  const iconPath =
    platform === "WALLAPOP" ? "/wallapop.webp" : "/vinted.webp";

  async function handleCreateListing() {
    if (!url.trim()) {
      toast.error("Introduce la URL del anuncio");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/marketplace-listing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al crear el anuncio");
        return;
      }
      toast.success(
        buyerHasTelegram
          ? "Anuncio guardado y notificado al comprador por Telegram"
          : "Anuncio guardado (el comprador no tiene Telegram vinculado)"
      );
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          <Image
            src={iconPath}
            alt={platformLabel}
            width={40}
            height={40}
            className="object-contain"
            onError={() => {}}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-snow">Envío {platformLabel}</h2>
          <p className="text-xs text-slate-400">{PAY_OPTION_LABEL[payOption] ?? payOption}</p>
        </div>
        <span
          className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full border ${LISTING_STATUS_COLOR[currentStatus] ?? "text-slate-400 bg-white/5 border-white/10"}`}
        >
          {LISTING_STATUS_LABEL[currentStatus] ?? currentStatus}
        </span>
      </div>

      {/* Enlace al anuncio si ya existe */}
      {listingUrl && (
        <a
          href={listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors truncate"
        >
          <ExternalLink size={12} className="shrink-0" />
          <span className="truncate">{listingUrl}</span>
        </a>
      )}

      {/* Instrucciones */}
      <div className="text-xs text-slate-400 bg-white/3 rounded-[8px] p-3 border border-white/6">
        {payOption === "PLATFORM" ? (
          <>
            <p className="font-medium text-slate-300 mb-1">Qué debes hacer:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Crea un anuncio en {platformLabel} con el importe total del pedido (el envío lo añade el comprador aparte)</li>
              <li>Pega la URL del anuncio abajo y pulsa el botón para notificar al comprador</li>
              <li>Una vez el comprador lo compre, marca el pedido como PAGADO</li>
            </ol>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-300 mb-1">Qué debes hacer:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>El comprador ya pagó los productos en la web (−1€ de descuento)</li>
              <li>Crea un anuncio de <strong>1€</strong> en {platformLabel} para el envío</li>
              <li>Pega la URL abajo para notificar al comprador dónde comprarlo</li>
            </ol>
          </>
        )}
      </div>

      {/* Input URL + botón */}
      <div className="flex flex-col gap-2">
        <label className="block text-xs text-slate-300">
          URL del anuncio en {platformLabel}
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={`https://${platform.toLowerCase()}.es/item/...`}
          className="w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors"
        />
        <Button
          onClick={handleCreateListing}
          loading={loading}
          disabled={!url.trim()}
          className="cursor-pointer"
        >
          <Send size={14} />
          {listingUrl ? "Actualizar anuncio y renotificar" : "Guardar anuncio y notificar por Telegram"}
        </Button>
        {!buyerHasTelegram && (
          <p className="text-xs text-amber-400/80">
            El comprador no tiene Telegram vinculado — no recibirá el DM automático.
          </p>
        )}
      </div>
    </div>
  );
}
