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
  // En desarrollo, si se define SKIP_TELEGRAM_MEMBERSHIP_CHECK=true
  // se omite la verificación para facilitar las pruebas.
  if (process.env.SKIP_TELEGRAM_MEMBERSHIP_CHECK === "true") {
    console.log("[Telegram] Comprobación de membresía omitida (modo dev)");
    return true;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!botToken) {
    console.error("[Telegram] TELEGRAM_BOT_TOKEN no definida");
    return false;
  }

  if (!groupId) {
    console.error("[Telegram] TELEGRAM_GROUP_ID no definida — debe ser el ID numérico negativo del grupo, ej: -1001234567890");
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${groupId}&user_id=${telegramUserId}`;
  console.log(`[Telegram] getChatMember → chat_id=${groupId} user_id=${telegramUserId}`);

  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();

    // Log completo para depuración en Vercel
    console.log("[Telegram] getChatMember response:", JSON.stringify(data));

    if (!res.ok || !data.ok) {
      console.error(`[Telegram] getChatMember falló: ${data.description ?? res.status}`);
      return false;
    }

    const status: string = data.result?.status;
    const isAllowed = ["member", "administrator", "creator"].includes(status);
    console.log(`[Telegram] user ${telegramUserId} status="${status}" allowed=${isAllowed}`);
    return isAllowed;
  } catch (error) {
    console.error("[Telegram] Error de red al verificar membresía:", error);
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
  buyerTelegramId?: string | null;
}): Promise<void> {
  const creatorId = "1856500527";

  try {
    const bot = getTelegramBot();
    const message =
      `🎴 *Nueva compra en DECKLAB!*\n\n` +
      `👤 *${params.userName}*\n` +
      `📦 ${params.productName}\n` +
      `💰 ${params.total}€\n` +
      `🔢 Pedido #${params.orderNumber}`;

    // Enviar al creador
    await bot.api.sendMessage(creatorId, message, { parse_mode: "Markdown" }).catch(e => console.error("Error notificando al creador:", e));

    // Enviar al comprador si tiene telegramId
    if (params.buyerTelegramId) {
      const buyerMessage =
        `🎉 *¡Gracias por tu compra en DECKLAB!*\n\n` +
        `📦 ${params.productName}\n` +
        `💰 ${params.total}€\n` +
        `🔢 Pedido #${params.orderNumber}\n\n` +
        `Te notificaremos por aquí cuando cambie el estado de tu pedido.`;
      
      await bot.api.sendMessage(params.buyerTelegramId, buyerMessage, { parse_mode: "Markdown" }).catch(e => console.error("Error notificando al comprador:", e));
    }
  } catch (error) {
    console.error("Error en notifyPurchase:", error);
  }
}

export async function notifyNewProduct(params: {
  productTitle: string;
  productSlug: string;
  price: string;
}): Promise<void> {
  const groupId = process.env.TELEGRAM_GROUP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com";
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
  isCreator?: boolean;
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
    let message = params.isCreator
      ? `${emoji} *El pedido #${params.orderNumber} ha sido actualizado*\n\nEstado: *${params.newStatus}*`
      : `${emoji} *Tu pedido #${params.orderNumber} ha sido actualizado*\n\nEstado: *${params.newStatus}*`;

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

export async function notifyMarketplacePurchase(params: {
  userName: string;
  productName: string;
  total: string;
  orderNumber: number;
  platform: string;
  payOption: string;
  buyerTelegramId?: string | null;
}): Promise<void> {
  const creatorId = "1856500527";
  const platformLabel = params.platform === "WALLAPOP" ? "Wallapop" : "Vinted";
  const payLabel = params.payOption === "WEB" ? "Pagado en web (−1€)" : "Pendiente en plataforma";

  try {
    const bot = getTelegramBot();
    const adminMessage =
      `🛍️ *Nuevo pedido marketplace en DECKLAB!*\n\n` +
      `👤 *${params.userName}*\n` +
      `📦 ${params.productName}\n` +
      `💰 ${params.total}€ · Pedido #${params.orderNumber}\n` +
      `🏷️ Plataforma: *${platformLabel}* · Pago: ${payLabel}\n\n` +
      `⚡ Crea el anuncio desde el panel admin.`;

    await bot.api.sendMessage(creatorId, adminMessage, { parse_mode: "Markdown" }).catch(
      (e) => console.error("Error notificando al creador (marketplace):", e)
    );

    if (params.buyerTelegramId) {
      const buyerMessage =
        `🎉 *¡Pedido registrado en DECKLAB!*\n\n` +
        `📦 ${params.productName}\n` +
        `💰 ${params.total}€ · Pedido #${params.orderNumber}\n` +
        `🏷️ Envío por *${platformLabel}*\n\n` +
        `Recibirás el enlace al anuncio por aquí en breve.`;

      await bot.api
        .sendMessage(params.buyerTelegramId, buyerMessage, { parse_mode: "Markdown" })
        .catch((e) => console.error("Error notificando al comprador (marketplace):", e));
    }
  } catch (error) {
    console.error("Error en notifyMarketplacePurchase:", error);
  }
}

export async function sendMarketplaceListingDM(params: {
  telegramId: string;
  orderNumber: number;
  platform: string;
  listingUrl: string;
  payOption: string;
}): Promise<void> {
  const platformLabel = params.platform === "WALLAPOP" ? "Wallapop" : "Vinted";
  const isWeb = params.payOption === "WEB";

  try {
    const bot = getTelegramBot();
    const message = isWeb
      ? `🔗 *Anuncio de envío listo — Pedido #${params.orderNumber}*\n\n` +
        `Tu anuncio de *1€* en *${platformLabel}* para el envío ya está disponible:\n` +
        `👉 [Comprar envío aquí](${params.listingUrl})\n\n` +
        `📦 Incluye envío con seguimiento de Correos.\n` +
        `Una vez lo compres, te enviamos tu pedido.`
      : `🔗 *Anuncio listo — Pedido #${params.orderNumber}*\n\n` +
        `Tu anuncio en *${platformLabel}* ya está disponible:\n` +
        `👉 [Comprar aquí](${params.listingUrl})\n\n` +
        `📦 El precio incluye los productos. El envío se añade aparte en la plataforma.\n` +
        `Una vez realices la compra, recibirás tu pedido.`;

    await bot.api.sendMessage(params.telegramId, message, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error enviando DM de anuncio marketplace:", error);
  }
}
