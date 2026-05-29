"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, X, Eye, EyeOff, Loader2 } from "lucide-react";

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER" as "ADMIN" | "CUSTOMER",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleClose() {
    setOpen(false);
    setForm({ name: "", email: "", password: "", role: "CUSTOMER" });
    setShowPassword(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* vacío */ }

      if (!res.ok) {
        toast.error(data.error ?? "Error al crear el usuario");
        return;
      }
      toast.success("Usuario creado correctamente");
      handleClose();
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors";

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-ash-50 text-graphite-700 text-sm font-semibold hover:bg-ash-50/90 transition-colors"
      >
        <UserPlus size={15} />
        Nuevo usuario
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-graphite-700 border border-white/10 rounded-[20px] w-full max-w-md p-6 flex flex-col gap-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-snow">Nuevo usuario</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-[6px] text-slate-300 hover:text-snow hover:bg-white/8 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Nombre <span className="text-ember-red">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Email <span className="text-ember-red">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Contraseña inicial <span className="text-ember-red">*</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300/60 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-xs text-slate-300/50 mt-1">
                  El usuario podrá cambiarla desde su perfil.
                </p>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Rol</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="CUSTOMER">Cliente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 rounded-[8px] text-sm text-slate-300 hover:text-snow bg-white/5 hover:bg-white/8 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] text-sm font-semibold bg-ash-50 text-graphite-700 hover:bg-ash-50/90 disabled:opacity-60 transition-colors"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Crear usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
