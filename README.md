# DECKLAB SHOP

> 🎴 Tienda de Pokémon TCG personalizado — Acceso privado exclusivo para miembros del grupo de Telegram.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Prisma v6 · Neon PostgreSQL · NextAuth v5 · Stripe · PayPal · grammY Bot · Resend

## 🚀 Desarrollo Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus valores reales
```

### 3. Base de datos

```bash
npm run db:generate   # Generar cliente Prisma
npm run db:migrate    # Crear tablas
npm run db:seed       # Poblar con datos iniciales
```

### 4. Iniciar

```bash
npm run dev   # Next.js en localhost:3000
npm run bot   # Bot de Telegram (proceso separado)
```

## 📋 Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run bot` | Iniciar bot de Telegram |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:migrate` | Crear/aplicar migraciones |
| `npm run db:seed` | Poblar BD con datos iniciales |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run type-check` | Verificar tipos TypeScript |

## 🔐 Variables Críticas

Ver `.env.example` para la lista completa.

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Secreto NextAuth (openssl rand -base64 32) |
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram (@BotFather) |
| `TELEGRAM_GROUP_ID` | ID del grupo privado (negativo) |
| `STRIPE_SECRET_KEY` | Clave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto webhook Stripe |
| `RESEND_API_KEY` | API key Resend |

## 💳 Stripe Webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🎴 Características

- Acceso privado vía Telegram Login Widget + Bot API
- 5 Tiers PRO con capacidad de gasto mensual acumulable
- Suscripciones bimestrales (permanencia mínima 2 meses)
- Envíos por peso (Correos España: Ordinario + Certificado)
- Probabilidades de productos publicadas
- Sin devoluciones
- Panel de administración completo
- Bot Telegram con notificaciones y comandos
- PDF de factura adjunto en email de confirmación

## 📄 Licencia

Privado — DECKLAB © 2026
