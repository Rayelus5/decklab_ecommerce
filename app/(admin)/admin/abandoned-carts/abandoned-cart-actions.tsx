"use client";

import { useState } from "react";
import { Trash2, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AbandonedCartActionsProps {
  cartId: string;
  recoveryEmailSentAt: Date | null;
  convertedAt: Date | null;
}

export function AbandonedCartActions({
  cartId,
  recoveryEmailSentAt,
  convertedAt,
}: AbandonedCartActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [emailing, setEmailing] = useState(false);

  if (convertedAt) {
    return null; // Carritos convertidos no tienen acciones
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este carrito y liberar el stock reservado?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${cartId}`, {
        method: "DELETE",
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }
      if (!res.ok) {
        toast.error(data.error ?? "Error al eliminar el carrito");
        return;
      }
      toast.success("Carrito eliminado y stock liberado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSendEmail() {
    if (recoveryEmailSentAt) {
      toast.info("El email de recuperación ya fue enviado");
      return;
    }
    setEmailing(true);
    try {
      const res = await fetch(`/api/admin/abandoned-carts/${cartId}`, {
        method: "POST",
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }
      if (!res.ok) {
        toast.error(data.error ?? "Error al enviar el email");
        return;
      }
      toast.success("Email de recuperación enviado");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setEmailing(false);
    }
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={handleSendEmail}
        disabled={emailing || !!recoveryEmailSentAt}
        title={recoveryEmailSentAt ? "Email ya enviado" : "Enviar email de recuperación"}
        className={`p-1.5 rounded-[6px] transition-colors ${
          recoveryEmailSentAt
            ? "text-slate-300/30 cursor-not-allowed"
            : "text-slate-300 hover:text-mint-signal hover:bg-white/5"
        }`}
      >
        {emailing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Mail size={14} />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Eliminar carrito y liberar stock"
        className="cursor-pointer p-1.5 rounded-[6px] text-slate-300 hover:text-ember-red hover:bg-white/5 transition-colors"
      >
        {deleting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </div>
  );
}
