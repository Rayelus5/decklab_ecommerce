import * as crypto from "crypto";
import { Bot } from "grammy";

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// -------------------------------------------------------
// Singleton del Bot
// -------------------------------------------------------
let _bot: Bot | null = null;

export function getTelegramBot(): Bot {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN no está definida");
  }
  if (!_bot) {
    _bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return _bot;
}

// -------------------------------------------------------
// Verificación de firma del Telegram Login Widget
// El widget firma los datos con HMAC-SHA256 usando como clave
// SHA256(BOT_TOKEN) — documentado en https://core.telegram.org/widgets/login
// -------------------------------------------------------
export function verifyTelegramWidgetData(data: TelegramAuthData): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  const { hash, ...rest } = data;

  // Construir el data-check-string: campo=valor\n ordenados alfabéticamente
  const checkString = Object.entries(rest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // Clave secreta = SHA256 del token del bot
  const secretKey = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  // Verificar que los datos no tienen más de 24 horas de antigüedad
  const authDate = new Date(data.auth_date * 1000);
  const now = new Date();
  const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return false; // Datos expirados
  }

  return expectedHash === hash;
}

// -------------------------------------------------------
// Verificar membresía en el grupo privado
// Llama a getChatMember via Bot API REST
// -------------------------------------------------------
export async function checkGroupMembership(
  telegramUserId: number
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!botToken || !groupId) {
    console.error("TELEGRAM_BOT_TOKEN o TELEGRAM_GROUP_ID no definidos");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${groupId}&user_id=${telegramUserId}`,
      { method: "GET" }
    );

    if (!res.ok) {
      console.error("Error al llamar a getChatMember:", res.status);
      return false;
    }

    const data = await res.json();

    if (!data.ok) {
      console.error("getChatMember devolvió error:", data.description);
      return false;
    }

    const status: string = data.result?.status;
    // Los estados válidos de membresía
    return ["member", "administrator", "creator"].includes(status);
  } catch (error) {
    console.error("Error verificando membresía de Telegram:", error);
    return false;
  }
}

// -------------------------------------------------------
// Notificaciones del Bot al grupo
// -------------------------------------------------------
export async function notifyPurchase(params: {
  userName: string;
  productName: string;
  total: string;
  orderNumber: number;
}): Promise<void> {
  const groupId = process.env.TELEGRAM_GROUP_ID;
  if (!groupId) return;

  try {
    const bot = getTelegramBot();
    const message =
      `🎴 *Nueva compra en DECKLAB!*\n\n` +
      `👤 *${params.userName}*\n` +
      `📦 ${params.productName}\n` +
      `💰 ${params.total}€\n` +
      `🔢 Pedido #${params.orderNumber}`;

    await bot.api.sendMessage(groupId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error enviando notificación de compra al grupo:", error);
  }
}

export async function notifyNewProduct(params: {
  productTitle: string;
  productSlug: string;
  price: string;
}): Promise<void> {
  const groupId = process.env.TELEGRAM_GROUP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.shop";
  if (!groupId) return;

  try {
    const bot = getTelegramBot();
    const url = `${appUrl}/products/${params.productSlug}`;
    const message =
      `🆕 *Nuevo producto disponible en DECKLAB!*\n\n` +
      `📦 *${params.productTitle}*\n` +
      `💰 Desde ${params.price}€\n\n` +
      `👉 [Ver producto](${url})`;

    await bot.api.sendMessage(groupId, message, {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: false },
    });
  } catch (error) {
    console.error("Error enviando notificación de nuevo producto:", error);
  }
}

export async function sendOrderStatusDM(params: {
  telegramId: string;
  orderNumber: number;
  newStatus: string;
  trackingNumber?: string;
}): Promise<void> {
  try {
    const bot = getTelegramBot();
    const statusEmoji: Record<string, string> = {
      PAID: "✅",
      PROCESSING: "⚙️",
      SHIPPED: "📦",
      DELIVERED: "🎉",
      CANCELLED: "❌",
      REFUNDED: "💸",
    };

    const emoji = statusEmoji[params.newStatus] ?? "ℹ️";
    let message =
      `${emoji} *Tu pedido #${params.orderNumber} ha sido actualizado*\n\n` +
      `Estado: *${params.newStatus}*`;

    if (params.trackingNumber) {
      message +=
        `\n\n📍 Número de seguimiento: \`${params.trackingNumber}\`\n` +
        `🔗 [Seguir en Correos](https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${params.trackingNumber})`;
    }

    await bot.api.sendMessage(params.telegramId, message, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error enviando DM de estado de pedido:", error);
  }
}
