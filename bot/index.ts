/**
 * DECKLAB SHOP — Bot de Telegram
 * Framework: grammY
 * Ejecutar: npm run bot
 *
 * El bot corre como proceso separado de Next.js.
 * Funciones de notificación (notifyPurchase, etc.) se exportan desde lib/telegram.ts
 * y se llaman desde los webhooks de Stripe/PayPal.
 */

import { Bot, Context, InlineKeyboard } from "grammy";
import { PrismaClient } from "@prisma/client";

// Cargar variables de entorno manualmente en el bot
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN no está definida. Aborting.");
  process.exit(1);
}

const prisma = new PrismaClient();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com";

/**
 * Telegram exige que los botones de inline keyboard usen URLs https:// públicas.
 * En desarrollo (localhost / http://) devuelve null para omitir el teclado.
 */
function inlineUrl(path: string): string | null {
  try {
    const url = new URL(path, APP_URL);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return url.href;
  } catch {
    return null;
  }
}

// =============================================================
// Utilidades
// =============================================================

async function getUserByTelegramId(telegramId: number) {
  return prisma.user.findFirst({
    where: { telegramId: String(telegramId) },
    include: { proTier: true },
  });
}

function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "⏳ Pendiente",
    PAID: "✅ Pagado",
    PROCESSING: "⚙️ En procesamiento",
    SHIPPED: "📦 Enviado",
    DELIVERED: "🎉 Entregado",
    CANCELLED: "❌ Cancelado",
    REFUNDED: "💸 Reembolsado",
  };
  return statusMap[status] ?? status;
}

// Rate limiting simple en memoria
const commandCooldowns = new Map<number, Map<string, number>>();

function isOnCooldown(userId: number, command: string, cooldownMs: number = 10000): boolean {
  const userCooldowns = commandCooldowns.get(userId);
  if (!userCooldowns) return false;
  const lastUsed = userCooldowns.get(command);
  if (!lastUsed) return false;
  return Date.now() - lastUsed < cooldownMs;
}

function setCooldown(userId: number, command: string): void {
  if (!commandCooldowns.has(userId)) {
    commandCooldowns.set(userId, new Map());
  }
  commandCooldowns.get(userId)!.set(command, Date.now());
}

// =============================================================
// Comandos del Bot
// =============================================================

// /start — Bienvenida
bot.command("start", async (ctx: Context) => {
  const firstName = ctx.from?.first_name ?? "Entrenador";

  await ctx.reply(
    `🎴 *¡Bienvenido a DECKLAB, ${firstName}!*\n\n` +
    `Soy el bot oficial de la tienda. Aquí tienes lo que puedo hacer por ti:\n\n` +
    `📦 /pedido <ID> — Ver estado de un pedido específico\n` +
    `📋 /mispedidos — Ver tus últimos 3 pedidos\n` +
    `❓ /ayuda — Mostrar esta ayuda\n\n` +
    `🛍️ [Visitar la tienda](${APP_URL}/products)\n\n` +
    `_Para usar los comandos de pedidos, tu cuenta de Telegram debe estar vinculada a tu cuenta de DECKLAB._`,
    {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    }
  );
});

// /ayuda — Ayuda
bot.command("ayuda", async (ctx: Context) => {
  await ctx.reply(
    `🤖 *Comandos disponibles:*\n\n` +
    `• /pedido <ID> — Estado de un pedido por ID\n` +
    `  _Ejemplo: /pedido 1042_\n\n` +
    `• /mispedidos — Tus últimos 3 pedidos\n\n` +
    `• /start — Mensaje de bienvenida\n\n` +
    `• /ayuda — Esta lista de comandos\n\n` +
    `💡 _Para ver tus pedidos, tu cuenta de Telegram debe estar vinculada._\n` +
    `🔗 [Vincular cuenta](${APP_URL}/profile/settings)`,
    {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    }
  );
});

// /pedido <id> — Estado de un pedido específico
bot.command("pedido", async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Rate limiting
  if (isOnCooldown(telegramId, "pedido")) {
    await ctx.reply("⏱️ Espera unos segundos antes de usar este comando de nuevo.");
    return;
  }
  setCooldown(telegramId, "pedido");

  const rawMatch = ctx.match;
  const args = typeof rawMatch === "string" ? rawMatch.trim() : rawMatch?.[0]?.trim();
  if (!args) {
    await ctx.reply(
      "❌ Debes especificar el número de pedido.\n_Ejemplo: /pedido 1042_",
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Buscar usuario vinculado
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await ctx.reply(
      `❌ Tu cuenta de Telegram no está vinculada a DECKLAB.\n\n` +
      `🔗 [Vincular cuenta](${APP_URL}/profile/settings)`,
      { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
    );
    return;
  }

  const orderNumber = parseInt(args, 10);
  if (isNaN(orderNumber)) {
    await ctx.reply("❌ Número de pedido inválido. Usa solo números.");
    return;
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId: user.id, // Solo puede ver SUS pedidos
    },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
      shipment: true,
    },
  });

  if (!order) {
    await ctx.reply(
      `❌ No encontré el pedido #${orderNumber} en tu cuenta.\n\n` +
      `_Verifica el número de pedido en_ [tus pedidos](${APP_URL}/profile/orders)`,
      { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
    );
    return;
  }

  const statusText = formatOrderStatus(order.status);
  const itemsList = order.items
    .map(
      (item) =>
        `  • ${item.variant.product.title}${item.variant.title ? ` (${item.variant.title})` : ""} × ${item.quantity}`
    )
    .join("\n");

  let message =
    `📦 *Pedido #${order.orderNumber}*\n\n` +
    `Estado: ${statusText}\n` +
    `Total: *${Number(order.total).toFixed(2)}€*\n\n` +
    `📋 *Artículos:*\n${itemsList}`;

  if (order.shipment?.trackingNumber) {
    message +=
      `\n\n🚚 *Seguimiento:* \`${order.shipment.trackingNumber}\`\n` +
      `[Ver en Correos](https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${order.shipment.trackingNumber})`;
  }

  const ordersUrl = inlineUrl("/profile/orders");
  const keyboard = ordersUrl
    ? new InlineKeyboard().url("Ver en DECKLAB", ordersUrl)
    : undefined;

  await ctx.reply(message, {
    parse_mode: "Markdown",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
});

// /groupid — Devuelve el ID del chat actual (solo admins del grupo o en DM)
// Útil para configurar TELEGRAM_GROUP_ID en las variables de entorno.
bot.command("groupid", async (ctx: Context) => {
  const from = ctx.from;
  if (!from) return;

  const chat = ctx.chat;
  const isGroup = chat?.type === "group" || chat?.type === "supergroup";

  // En grupos: verificar que quien lo ejecuta es admin del grupo
  if (isGroup) {
    try {
      const member = await ctx.getChatMember(from.id);
      const isAdmin = ["administrator", "creator"].includes(member.status);
      if (!isAdmin) {
        await ctx.reply("Este comando solo puede usarlo un administrador del grupo.");
        return;
      }
    } catch {
      await ctx.reply("No pude verificar tus permisos en este grupo.");
      return;
    }
  }

  const chatId = chat?.id;
  const userId = from.id;

  const lines: string[] = [];

  if (isGroup) {
    lines.push(`*Chat ID del grupo:* \`${chatId}\``);
    lines.push(`*Tipo:* ${chat?.type}`);
    lines.push(`*Nombre:* ${chat?.title ?? "—"}`);
    lines.push("");
    lines.push(`*Tu Telegram ID:* \`${userId}\``);
    lines.push("");
    lines.push("Copia el *Chat ID* y ponlo como `TELEGRAM_GROUP_ID` en tus variables de entorno de Vercel.");
  } else {
    // DM: solo muestra el ID del usuario
    lines.push(`*Tu Telegram ID:* \`${userId}\``);
    lines.push("");
    lines.push("Para obtener el ID de un grupo, usa este comando dentro del grupo.");
  }

  await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
});

// /mispedidos — Últimos 3 pedidos
bot.command("mispedidos", async (ctx: Context) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Rate limiting
  if (isOnCooldown(telegramId, "mispedidos", 15000)) {
    await ctx.reply("⏱️ Espera unos segundos antes de usar este comando de nuevo.");
    return;
  }
  setCooldown(telegramId, "mispedidos");

  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await ctx.reply(
      `❌ Tu cuenta de Telegram no está vinculada a DECKLAB.\n\n` +
      `🔗 [Vincular cuenta](${APP_URL}/profile/settings)`,
      { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
    );
    return;
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { shipment: true },
  });

  if (orders.length === 0) {
    await ctx.reply("No tienes pedidos en DECKLAB todavía.");
    return;
  }

  const orderLines = orders
    .map(
      (order) =>
        `• *#${order.orderNumber}* — ${formatOrderStatus(order.status)} — ${Number(order.total).toFixed(2)}€` +
        (order.shipment?.trackingNumber ? ` 📍 \`${order.shipment.trackingNumber}\`` : "")
    )
    .join("\n");

  const ordersUrl = inlineUrl("/profile/orders");
  const keyboard = ordersUrl
    ? new InlineKeyboard().url("Ver todos los pedidos", ordersUrl)
    : undefined;

  await ctx.reply(
    `📋 *Tus últimos pedidos:*\n\n${orderLines}`,
    {
      parse_mode: "Markdown",
      ...(keyboard ? { reply_markup: keyboard } : {}),
    }
  );
});

// =============================================================
// Manejo de errores
// =============================================================
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`❌ Error en el bot al manejar update ${ctx.update.update_id}:`, err.error);
});

// =============================================================
// Iniciar el bot
// =============================================================
async function startBot() {
  console.log("🤖 Iniciando bot de Telegram DECKLAB...");
  console.log(`📡 Modo: Long Polling`);

  try {
    const me = await bot.api.getMe();
    console.log(`✅ Bot conectado como @${me.username} (${me.first_name})`);

    // Configurar comandos en el menú de Telegram
    await bot.api.setMyCommands([
      { command: "start", description: "Bienvenida e información" },
      { command: "pedido", description: "Ver estado de un pedido (#ID)" },
      { command: "mispedidos", description: "Ver tus últimos 3 pedidos" },
      { command: "ayuda", description: "Lista de comandos" },
      { command: "groupid", description: "Obtener el ID de este grupo (solo admins)" },
    ]);
    console.log("✅ Comandos configurados en Telegram");

    bot.start({
      onStart: (botInfo) => {
        console.log(`\n🚀 Bot @${botInfo.username} en línea y escuchando...\n`);
      },
    });
  } catch (error) {
    console.error("❌ Error al iniciar el bot:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Limpieza al salir
process.on("SIGINT", async () => {
  console.log("\n🛑 Deteniendo bot...");
  bot.stop();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  bot.stop();
  await prisma.$disconnect();
  process.exit(0);
});

startBot();
