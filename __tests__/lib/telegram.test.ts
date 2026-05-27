import { describe, it, expect, vi, afterEach } from "vitest";
import * as crypto from "crypto";

// Mockear grammy antes de importar telegram.ts
vi.mock("grammy", () => ({
  Bot: vi.fn().mockImplementation(() => ({
    api: { getChatMember: vi.fn() },
  })),
}));

import { verifyTelegramWidgetData } from "@/lib/telegram";
import type { TelegramAuthData } from "@/lib/telegram";

// Helper para generar datos válidos de Telegram Widget con un token de prueba
function generateValidTelegramData(
  botToken: string,
  overrides: Partial<TelegramAuthData> = {}
): TelegramAuthData {
  const authDate = Math.floor(Date.now() / 1000); // Ahora en segundos

  const data: Omit<TelegramAuthData, "hash"> = {
    id: 123456789,
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    auth_date: authDate,
    ...overrides,
  };

  // Construir el check string (alphabetically sorted)
  const checkString = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // Generar hash con el token de prueba
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  return { ...data, hash };
}

describe("verifyTelegramWidgetData", () => {
  const TEST_TOKEN = "1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true for valid data with correct signature", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", TEST_TOKEN);
    const data = generateValidTelegramData(TEST_TOKEN);
    expect(verifyTelegramWidgetData(data)).toBe(true);
  });

  it("returns false when TELEGRAM_BOT_TOKEN is not set", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    const data = generateValidTelegramData(TEST_TOKEN);
    // Sin token no se puede verificar
    expect(verifyTelegramWidgetData(data)).toBe(false);
  });

  it("returns false when hash is tampered", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", TEST_TOKEN);
    const data = generateValidTelegramData(TEST_TOKEN);
    const tampered = { ...data, hash: "deadbeefdeadbeef" + data.hash.slice(16) };
    expect(verifyTelegramWidgetData(tampered)).toBe(false);
  });

  it("returns false when data is older than 24 hours", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", TEST_TOKEN);
    const twentyFiveHoursAgo = Math.floor(Date.now() / 1000) - 25 * 3600;
    const data = generateValidTelegramData(TEST_TOKEN, { auth_date: twentyFiveHoursAgo });
    // El hash es válido pero los datos están expirados
    expect(verifyTelegramWidgetData(data)).toBe(false);
  });

  it("returns false when signed with a different bot token", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", TEST_TOKEN);
    const wrongToken = "9876543210:ZYXwvuTSRqpoNMLkjiHGFedCBA";
    const data = generateValidTelegramData(wrongToken); // Firmado con otro token
    expect(verifyTelegramWidgetData(data)).toBe(false);
  });

  it("returns false when a field is modified after signing", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", TEST_TOKEN);
    const data = generateValidTelegramData(TEST_TOKEN);
    // Modificar el ID sin regenerar el hash → inválido
    const modified = { ...data, id: 999999999 };
    expect(verifyTelegramWidgetData(modified)).toBe(false);
  });
});
