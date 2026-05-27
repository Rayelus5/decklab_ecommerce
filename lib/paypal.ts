/**
 * PayPal REST API v2 client
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 *
 * Variables de entorno necesarias:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_ENV  →  "sandbox" (por defecto) | "live"
 */

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// -------------------------------------------------------
// OAuth — access token
// -------------------------------------------------------
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const env = process.env.PAYPAL_ENV ?? "sandbox";

  if (!clientId || !clientSecret) {
    throw new Error(
      `PayPal: PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no configurados (PAYPAL_ENV=${env})`
    );
  }

  // Detectar mismatch típico: credenciales de sandbox usadas contra live (o al revés)
  const isSandboxId = clientId.startsWith("A") && clientId.length > 60;
  if (env === "live" && isSandboxId) {
    console.warn(
      "[PayPal] ADVERTENCIA: PAYPAL_ENV=live pero PAYPAL_CLIENT_ID parece ser de sandbox. " +
      "Usa las credenciales de la app de producción en developer.paypal.com."
    );
  }

  console.log(`[PayPal] Auth → endpoint: ${PAYPAL_BASE} (PAYPAL_ENV=${env})`);

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `PayPal auth error ${res.status} (env=${env}, endpoint=${PAYPAL_BASE}): ${err}`
    );
  }

  const data = await res.json();
  return data.access_token as string;
}

// -------------------------------------------------------
// Crear orden de pago
// -------------------------------------------------------
export async function createPayPalOrder(params: {
  total: number;           // Total en EUR, ya calculado (con envío y descuento)
  description: string;     // Descripción breve del pedido
  returnUrl: string;       // URL a la que PayPal redirige tras el pago
  cancelUrl: string;       // URL a la que PayPal redirige si el usuario cancela
}): Promise<{ orderId: string; approvalUrl: string }> {
  const token = await getPayPalAccessToken();

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: params.total.toFixed(2),
        },
        description: params.description,
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          locale: "es-ES",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
        },
      },
    },
  };

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `decklab-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order error ${res.status}: ${err}`);
  }

  const data = await res.json();

  // PayPal devuelve el link de aprobación en data.links
  const approvalUrl =
    (data.links as Array<{ rel: string; href: string }>)?.find(
      (l) => l.rel === "payer-action"
    )?.href;

  if (!approvalUrl) {
    throw new Error("PayPal no devolvió approval URL");
  }

  return { orderId: data.id as string, approvalUrl };
}

// -------------------------------------------------------
// Capturar el pago (después de que el usuario apruebe)
// -------------------------------------------------------
export async function capturePayPalOrder(orderId: string): Promise<{
  status: string;
  captureId: string;
  amountCaptured: number;
}> {
  const token = await getPayPalAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    status: data.status as string,
    captureId: (capture?.id ?? data.id) as string,
    amountCaptured: parseFloat(capture?.amount?.value ?? "0"),
  };
}

// -------------------------------------------------------
// Codificación/decodificación del payload de checkout
// para pasarlo a través de la return_url (sin estado en servidor)
// -------------------------------------------------------
export interface PayPalCheckoutPayload {
  userId: string;
  addressId: string;
  shippingRateId: string;
  shippingType: string;
  shippingRegion: string;
  couponCode: string;
  couponId: string;
  discountAmount: number;
  isPro: boolean;
  cartItems: Array<{
    variantId: string;
    quantity: number;
    pricePaid: number;
    wasProPrice: boolean;
  }>;
}

export function encodePayload(payload: PayPalCheckoutPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodePayload(encoded: string): PayPalCheckoutPayload {
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
}
