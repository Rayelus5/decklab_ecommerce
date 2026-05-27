# DECKLAB SHOP — Checklist de Deploy a Producción

> Dominio: `decklab.rayelus.com`  
> Stack: Vercel (Next.js) + Neon (PostgreSQL) + Stripe + Resend + Telegram Bot

---

## 1. Base de Datos (Neon)

- [ ] Crear proyecto de producción en [neon.tech](https://neon.tech)
- [ ] Copiar `DATABASE_URL` de producción
- [ ] Ejecutar migraciones: `DATABASE_URL=<prod_url> npx prisma migrate deploy`
- [ ] Ejecutar seed de producción: `DATABASE_URL=<prod_url> npx prisma db seed`
- [ ] Verificar en Neon Console que hay datos (ProTiers, ShippingRates)

---

## 2. Variables de Entorno en Vercel

Ir a Vercel Dashboard → Settings → Environment Variables y añadir:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de Neon producción |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://decklab.rayelus.com` |
| `NEXT_PUBLIC_APP_URL` | `https://decklab.rayelus.com` |
| `GOOGLE_CLIENT_ID` | De Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | De Google Cloud Console |
| `TELEGRAM_BOT_TOKEN` | Del bot de producción (o el mismo de test) |
| `TELEGRAM_GROUP_ID` | ID del grupo privado real |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username del bot sin @ |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Del webhook en Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `RESEND_API_KEY` | De resend.com |
| `RESEND_FROM_EMAIL` | `noreply@decklab.rayelus.com` |
| `SENTRY_DSN` | De sentry.io |
| `NEXT_PUBLIC_SENTRY_DSN` | Mismo valor |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` de GA4 |

---

## 3. Google OAuth

- [ ] Ir a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [ ] Añadir `https://decklab.rayelus.com` a **Authorized JavaScript origins**
- [ ] Añadir `https://decklab.rayelus.com/api/auth/callback/google` a **Authorized redirect URIs**

---

## 4. Telegram Bot

### BotFather (widget login)
```
/setdomain → decklab.rayelus.com
```
- [ ] Ejecutar `/setdomain` en @BotFather con el bot de producción
- [ ] Verificar que el Login Widget carga sin "Bot domain invalid"

### Webhook del bot (notificaciones)
El bot corre como proceso separado. En Vercel no puedes ejecutar procesos largo.  
**Opciones:**
- Railway / Render / VPS para correr `npm run bot`
- O usar polling en lugar de webhooks (grammY lo soporta automáticamente)

---

## 5. Stripe (Producción)

- [ ] Activar cuenta Stripe en modo Live
- [ ] Crear webhook en [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
  - URL: `https://decklab.rayelus.com/api/webhooks/stripe`
  - Eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- [ ] Copiar `Signing secret` → `STRIPE_WEBHOOK_SECRET`
- [ ] Crear Stripe Prices para los ProTiers (bimestral):
  ```
  interval: month, interval_count: 2
  ```
- [ ] Actualizar `stripePriceId` en cada ProTier de la BD de producción

---

## 6. Resend (Email)

- [ ] Verificar dominio `decklab.rayelus.com` en [resend.com](https://resend.com/domains)
- [ ] Añadir registros DNS (MX, SPF, DKIM) que Resend proporciona
- [ ] Probar envío con `RESEND_FROM_EMAIL=noreply@decklab.rayelus.com`

---

## 7. Vercel Deploy

```bash
# Instalar Vercel CLI si no está
npm i -g vercel

# Conectar repo y hacer primer deploy
vercel --prod
```

- [ ] Conectar repo GitHub a Vercel
- [ ] Configurar dominio personalizado: `decklab.rayelus.com`
- [ ] Verificar que el build pasa: `npm run build` (debe terminar sin errores)
- [ ] Confirmar que `npm test` pasa: 30 tests en green

---

## 8. QA Final en Producción

- [ ] Registro de usuario con email → email de bienvenida llega
- [ ] Login con Google → redirige a /products
- [ ] Login con Telegram → verifica membresía en grupo → acceso concedido
- [ ] Añadir producto al carrito → precio correcto
- [ ] Checkout → Stripe → pago con tarjeta de prueba → Order creado en BD
- [ ] Email de confirmación con PDF adjunto llega
- [ ] Bot notifica en el grupo de Telegram
- [ ] Admin puede ver el pedido y cambiar estado a SHIPPED
- [ ] Email de tracking llega al usuario
- [ ] Sentry captura errores de prueba en el dashboard
- [ ] GA4 recibe eventos en Realtime Report

---

## 9. Comandos Útiles Post-Deploy

```bash
# Ver logs en Vercel
vercel logs https://decklab.rayelus.com

# Correr migraciones en producción
DATABASE_URL=$PROD_URL npx prisma migrate deploy

# Verificar DB de producción
DATABASE_URL=$PROD_URL npx prisma studio

# Test de envío de email
curl -X POST https://decklab.rayelus.com/api/debug/test-email  # (crear si hace falta)
```

---

## Notas Importantes

- El bot de Telegram **no puede correr en Vercel** (serverless). Necesita un proceso largo.
  Opciones: Railway (~5€/mes), Render (gratuito con limitaciones), VPS básico.
- Los source maps de Sentry solo se suben en builds de producción (configurado en `next.config.ts`).
- Prisma **DEBE ser v6.0.1**. Verificar antes del deploy: `npm list prisma`.
- Los ProTiers en Stripe **deben** tener `interval_count: 2` (cobro cada 2 meses).
