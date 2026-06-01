"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Mail,
  Users,
  Crown,
  Loader2,
  Send,
  Check,
  Search,
  Megaphone,
  Tag,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecipientFilter = "all" | "pro" | "specific";
type EmailVariant = "announcement" | "promotion" | "news";

interface User {
  id: string;
  name: string | null;
  email: string;
  isPro: boolean;
}

interface EmailComposerProps {
  users: User[];
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const TEMPLATES: Array<{
  id: EmailVariant;
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  accentClass: string;
  borderClass: string;
  previewAccent: string;
}> = [
  {
    id: "announcement",
    label: "Anuncio general",
    description: "Comunicación neutra para avisos y novedades generales",
    Icon: Megaphone,
    accentClass: "text-slate-200",
    borderClass: "border-white/20",
    previewAccent: "#e5e5e5",
  },
  {
    id: "promotion",
    label: "Promoción / oferta",
    description: "Destacado en ámbar para ofertas, descuentos y campañas",
    Icon: Tag,
    accentClass: "text-amber-400",
    borderClass: "border-amber-500/40",
    previewAccent: "#fbbf24",
  },
  {
    id: "news",
    label: "Novedad de producto",
    description: "Estilo azul para lanzamientos y novedades de productos",
    Icon: Sparkles,
    accentClass: "text-sky-400",
    borderClass: "border-sky-500/40",
    previewAccent: "#38bdf8",
  },
];

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function EmailComposer({ users }: EmailComposerProps) {
  // --- Estado del formulario ---
  const [filter, setFilter] = useState<RecipientFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState("");

  const [variant, setVariant] = useState<EmailVariant>("announcement");
  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  const [sending, setSending] = useState(false);

  // --- Cálculo de destinatarios ---
  const recipientCount = useMemo(() => {
    if (filter === "all") return users.length;
    if (filter === "pro") return users.filter((u) => u.isPro).length;
    return selectedIds.size;
  }, [filter, users, selectedIds]);

  // --- Usuarios filtrados para el buscador ---
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // --- Helpers de selección ---
  function toggleUser(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // --- Envío ---
  async function handleSend() {
    if (!subject.trim() || !heading.trim() || !body.trim()) {
      toast.error("Completa el asunto, el encabezado y el cuerpo del email");
      return;
    }
    if (filter === "specific" && selectedIds.size === 0) {
      toast.error("Selecciona al menos un usuario");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientFilter: filter,
          userIds: filter === "specific" ? Array.from(selectedIds) : undefined,
          subject: subject.trim(),
          variant,
          heading: heading.trim(),
          body: body.trim(),
          ctaText: ctaText.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      });

      let data: { sent?: number; recipients?: number; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* vacío */
      }

      if (!res.ok) {
        toast.error(data.error ?? "Error al enviar los emails");
        return;
      }

      toast.success(
        `Campaña enviada a ${data.sent ?? data.recipients ?? recipientCount} destinatario${recipientCount !== 1 ? "s" : ""}`
      );

      // Reset parcial — mantener template seleccionada
      setSubject("");
      setHeading("");
      setBody("");
      setCtaText("");
      setCtaUrl("");
      setSelectedIds(new Set());
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSending(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5">

      {/* ── Sección 1: Destinatarios ── */}
      <section className="bg-graphite-700/40 border border-white/8 rounded-[14px] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-slate-300" />
          <h2 className="text-sm font-semibold text-snow">Destinatarios</h2>
        </div>

        {/* Radio group */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: "all" as const, label: "Todos", count: users.length },
              { value: "pro" as const, label: "Solo PRO", count: users.filter((u) => u.isPro).length },
              { value: "specific" as const, label: "Específicos", count: null },
            ] as const
          ).map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={[
                "flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-[9px] border text-left transition-all",
                filter === value
                  ? "bg-white/8 border-white/20 text-snow"
                  : "bg-white/2 border-white/6 text-slate-300 hover:text-snow hover:border-white/12",
              ].join(" ")}
            >
              <span className="text-sm font-medium">{label}</span>
              {count !== null && (
                <span className="text-xs text-slate-300/60 tabular-nums">
                  {count} usuario{count !== 1 ? "s" : ""}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Selector de usuarios específicos */}
        {filter === "specific" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300/60" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-white/4 border border-white/8 rounded-[8px] pl-8 pr-3 py-2 text-sm text-snow placeholder:text-slate-300/40 outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <button
                onClick={selectAll}
                className="shrink-0 px-3 py-2 text-xs text-slate-300 hover:text-snow bg-white/4 hover:bg-white/8 border border-white/8 rounded-[8px] transition-colors"
              >
                Todos
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={clearSelection}
                  className="shrink-0 px-3 py-2 text-xs text-slate-300 hover:text-snow bg-white/4 hover:bg-white/8 border border-white/8 rounded-[8px] transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto flex flex-col divide-y divide-white/5 border border-white/8 rounded-[9px]">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-slate-300/50 px-3 py-4 text-center">
                  Sin resultados
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const checked = selectedIds.has(user.id);
                  return (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/3 transition-colors"
                    >
                      {/* Checkbox */}
                      <div
                        className={[
                          "w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
                          checked
                            ? "bg-snow border-snow"
                            : "border-white/20 bg-transparent",
                        ].join(" ")}
                      >
                        {checked && <Check size={10} className="text-graphite-700" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleUser(user.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-snow truncate">
                          {user.name ?? "Sin nombre"}
                        </p>
                        <p className="text-xs text-slate-300/60 truncate">{user.email}</p>
                      </div>
                      {user.isPro && (
                        <Crown size={11} className="text-amber-400 shrink-0" />
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {selectedIds.size > 0 && (
              <p className="text-xs text-slate-300/60">
                {selectedIds.size} usuario{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Sección 2: Plantilla ── */}
      <section className="bg-graphite-700/40 border border-white/8 rounded-[14px] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Mail size={15} className="text-slate-300" />
          <h2 className="text-sm font-semibold text-snow">Diseño del email</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((tpl) => {
            const selected = variant === tpl.id;
            const Icon = tpl.Icon;
            return (
              <button
                key={tpl.id}
                onClick={() => setVariant(tpl.id)}
                className={[
                  "flex flex-col gap-2 p-3 rounded-[10px] border text-left transition-all",
                  selected
                    ? `border-white/30 bg-white/6 ring-1 ring-white/20`
                    : `border-white/8 bg-white/2 hover:border-white/15`,
                ].join(" ")}
              >
                {/* Mini preview */}
                <div className="w-full h-14 rounded-[6px] bg-[#07080a] border border-white/8 flex flex-col items-center justify-center gap-1 overflow-hidden">
                  <div
                    className="h-1 rounded-full w-1/3"
                    style={{ backgroundColor: tpl.previewAccent, opacity: 0.9 }}
                  />
                  <div className="h-0.5 rounded-full w-2/3 bg-white/20" />
                  <div className="h-0.5 rounded-full w-1/2 bg-white/10" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={tpl.accentClass} />
                  <span className={`text-xs font-semibold ${tpl.accentClass}`}>
                    {tpl.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300/50 leading-snug">
                  {tpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Sección 3: Contenido ── */}
      <section className="bg-graphite-700/40 border border-white/8 rounded-[14px] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Send size={15} className="text-slate-300" />
          <h2 className="text-sm font-semibold text-snow">Contenido</h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* Asunto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300/70 font-medium">
              Asunto <span className="text-ember-red">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Novedad exclusiva para clientes DECKLAB"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white/4 border border-white/8 rounded-[8px] px-3 py-2.5 text-sm text-snow placeholder:text-slate-300/30 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Encabezado */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300/70 font-medium">
              Encabezado <span className="text-ember-red">*</span>
            </label>
            <input
              type="text"
              placeholder="Título principal del email"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="bg-white/4 border border-white/8 rounded-[8px] px-3 py-2.5 text-sm text-snow placeholder:text-slate-300/30 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Cuerpo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300/70 font-medium">
              Cuerpo del mensaje <span className="text-ember-red">*</span>
            </label>
            <textarea
              rows={6}
              placeholder="Escribe el contenido del email. Cada salto de línea generará un párrafo separado."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-white/4 border border-white/8 rounded-[8px] px-3 py-2.5 text-sm text-snow placeholder:text-slate-300/30 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300/70 font-medium">
              Botón CTA{" "}
              <span className="text-slate-300/40 font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Texto del botón"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="bg-white/4 border border-white/8 rounded-[8px] px-3 py-2.5 text-sm text-snow placeholder:text-slate-300/30 outline-none focus:border-white/20 transition-colors"
              />
              <input
                type="url"
                placeholder="https://..."
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                disabled={!ctaText.trim()}
                className="bg-white/4 border border-white/8 rounded-[8px] px-3 py-2.5 text-sm text-snow placeholder:text-slate-300/30 outline-none focus:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              />
            </div>
            <p className="text-xs text-slate-300/40">
              Si dejas el texto del botón vacío, no se incluirá CTA en el email.
            </p>
          </div>
        </div>
      </section>

      {/* ── Botón de envío ── */}
      <div className="flex items-center justify-between gap-4 py-1">
        <p className="text-sm text-slate-300/60">
          {recipientCount > 0 ? (
            <>
              Se enviará a{" "}
              <span className="text-snow font-medium">{recipientCount}</span>{" "}
              destinatario{recipientCount !== 1 ? "s" : ""}
            </>
          ) : (
            "Sin destinatarios seleccionados"
          )}
        </p>
        <button
          onClick={handleSend}
          disabled={sending || recipientCount === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-snow hover:bg-white text-graphite-700 text-sm font-semibold rounded-[9px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {sending ? "Enviando..." : "Enviar campaña"}
        </button>
      </div>

    </div>
  );
}
