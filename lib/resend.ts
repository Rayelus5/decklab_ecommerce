import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY no está definida en las variables de entorno");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Formato "Nombre <email>" para que el alias aparezca en el cliente de correo
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "DECKLAB SHOP <contacto@rayelus.com>";
