# DECKLAB SHOP — TASKS.md

> Última actualización: 2026-05-27
> Estado del proyecto: 🚧 Sprint 0 en progreso
> Leyenda: `[ ]` Pendiente | `[x]` Completado | `[~]` En progreso | `[!]` Bloqueado | `[s]` Saltado

---

## 🏗️ SPRINT 0 — Infraestructura & Setup

### 0.1 Inicialización del Proyecto
- [x] Crear proyecto Next.js 16 con App Router y TypeScript (`create-next-app`) → v16.2.6
- [x] Configurar `tsconfig.json` con `strict: true` y path alias `@/*`
- [x] Configurar Tailwind CSS v4 con tokens del DESIGN.md
- [x] Configurar ESLint 9 con reglas Next.js
- [ ] Configurar Prettier con formato estándar
- [x] Crear `.env.example` con todas las variables documentadas
- [~] Crear `.env.local` con valores de desarrollo (⚠️ RELLENAR CON VARIABLES REALES)
- [x] Crear `README.md` inicial con instrucciones básicas

### 0.2 Dependencias
- [x] Instalar dependencias de producción core (next 16.2.6, react 19.2.4, react-dom)
- [x] Instalar Prisma v6.0.1 + @prisma/client ✅ VERSIÓN VERIFICADA
- [x] Instalar NextAuth v5 beta + @auth/prisma-adapter
- [x] Instalar bcryptjs + @types/bcryptjs
- [x] Instalar Stripe + @stripe/stripe-js
- [x] Instalar Zustand v5
- [x] Instalar Framer Motion
- [x] Instalar Lucide React
- [x] Instalar ldrs
- [x] Instalar @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities
- [x] Instalar React Hook Form + @hookform/resolvers
- [x] Instalar Zod v4
- [x] Instalar Resend + React Email
- [x] Instalar jsPDF + jspdf-autotable
- [x] Instalar grammY (Telegram Bot framework)
- [x] Instalar three + @types/three (ShaderAnimation)
- [x] Instalar simplex-noise (WaveBackground)
- [x] Instalar decimal.js
- [x] Instalar date-fns
- [x] Instalar Sonner (toast notifications)
- [x] Instalar clsx + tailwind-merge
- [x] Instalar @neondatabase/serverless
- [x] Instalar Sentry (@sentry/nextjs)
- [ ] Instalar PayPal SDK

### 0.3 Estructura de Carpetas
- [x] Crear estructura completa de carpetas (app/, components/, lib/, emails/, bot/, prisma/, scripts/)
- [x] Crear `lib/prisma.ts` (singleton client)
- [x] Crear `lib/validations.ts` (schemas Zod base)
- [x] Crear `components/ui/` base (button, input, badge, card)

### 0.4 Componentes UI Creativos
- [x] Implementar `components/ui/shader-animation.tsx` (Three.js shader hero)
- [x] Implementar `components/ui/wave-background.tsx` (simplex-noise)

### 0.5 Configuración Next.js
- [x] Configurar `next.config.ts` (image domains, headers de seguridad)
- [x] Configurar Tailwind v4 con todos los tokens de DESIGN.md en `globals.css`
- [ ] Copiar `DESIGN.md` del proyecto anterior a este repo
- [x] Configurar fuente: Inter (primaria) en `app/layout.tsx`

### 0.6 Archivos de configuración
- [x] Crear `TASKS.md` en la raíz del proyecto
- [x] Actualizar `package.json` con scripts: `bot`, `db:*`, `email:dev`, `type-check`
- [x] Crear `tsconfig.bot.json` para el proceso del bot
- [x] Crear `lib/auth.ts` (NextAuth v5 config completa)
- [x] Crear `lib/stripe.ts` (Stripe client)
- [x] Crear `lib/resend.ts` (Resend email client)
- [x] Crear `lib/telegram.ts` (helpers bot + verificación HMAC + checkGroupMembership)
- [x] Crear `lib/shipping.ts` (lógica de cálculo de envíos)
- [x] Crear `lib/pro-logic.ts` (PRO allowance deduction/refill)
- [x] Crear `lib/coupon.ts` (validación y aplicación de cupones)
- [x] Crear `lib/hooks/use-cart.ts` (Zustand cart store)
- [x] Crear `middleware.ts` (protección de rutas + Telegram gate)
- [x] Crear `bot/index.ts` (Bot Telegram completo con grammY)
- [x] Crear `app/api/auth/[...nextauth]/route.ts`
- [x] Crear `app/api/auth/telegram/route.ts`

---

## 🗄️ SPRINT 1 — Schema & Base de Datos

### 1.1 Schema Prisma
- [x] Crear `prisma/schema.prisma` completo con todos los modelos
- [x] Modelo `User` (con Telegram: telegramId, telegramUsername, isTelegramMember, isBlocked)
- [x] Modelo `Account` (NextAuth OAuth)
- [x] Modelo `Session` (NextAuth)
- [x] Modelo `Address` (multi-dirección, isDefault, timestamps)
- [x] Modelo `Category` (jerárquica, sortOrder)
- [x] Modelo `Product` (earlyAccessTierLevel, isExclusive, probabilityData, noReturns)
- [x] Modelo `ProductVariant` (price, pricePro, proExempt, stock, weight en gramos)
- [x] Modelo `ProductImage` (position para drag & drop)
- [x] Modelo `ProTier` (priceMonthly, monthlyAllowance, stripePriceId, benefits: Json, isActive, sortOrder)
- [x] Modelo `ShippingRate` (minWeight, maxWeight, region, type, price, active)
- [x] Modelo `Coupon` (type, value, maxUses, expiresAt, productIds[], categoryIds[])
- [x] Modelo `Order` (couponCode snapshot, paypalOrderId, paymentMethod)
- [x] Modelo `OrderItem` (pricePaid, wasProPrice)
- [x] Modelo `Shipment` (trackingNumber, labelUrl, timestamps)
- [x] Modelo `AdminActionLog` (adminId, actionType, targetId, details)
- [x] Enum `UserRole` (ADMIN, CUSTOMER)
- [x] Enum `ShippingRegion` (NATIONAL, EUROPE)
- [x] Enum `OrderStatus` (7 estados)
- [x] Índices en campos de búsqueda frecuente

### 1.2 Migraciones
- [ ] ⚠️ RELLENAR `.env.local` CON DATABASE_URL REAL
- [ ] Ejecutar `npm run db:migrate` (primera migración)
- [ ] Verificar schema en Neon

### 1.3 Seed Data
- [x] Crear `prisma/seed.ts`
- [x] Seed: Admin user
- [x] Seed: 5 ProTiers con benefits configurables
- [x] Seed: 14 ShippingRates (ORDINARIO+CERTIFICADO × NATIONAL+EUROPE)
- [x] Seed: 4 Categorías base
- [x] Seed: Producto de ejemplo (solo desarrollo)
- [ ] Ejecutar `npm run db:seed`

---

## 🔐 SPRINT 2 — Autenticación

### 2.1 NextAuth Setup
- [x] `lib/auth.ts` con NextAuth v5 config (credentials + Google + custom session)
- [x] `app/api/auth/[...nextauth]/route.ts`
- [ ] Configurar GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET en .env.local

### 2.2 Telegram Login Widget
- [x] `lib/telegram.ts` con `verifyTelegramWidgetData` + `checkGroupMembership`
- [x] `app/api/auth/telegram/route.ts` (endpoint de callback)
- [ ] Crear `components/auth/telegram-login-button.tsx`
- [ ] Integrar el Telegram Login Widget script en la página de login
- [ ] Configurar TELEGRAM_BOT_TOKEN y TELEGRAM_GROUP_ID en .env.local

### 2.3 Registro & Login UI
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(auth)/register/page.tsx`
- [ ] `components/auth/login-form.tsx`
- [ ] `components/auth/register-form.tsx`

### 2.4 Middleware de Protección
- [x] `middleware.ts` protege rutas + verifica isTelegramMember

### 2.5 Página de Acceso Privado
- [ ] `app/acceso-privado/page.tsx` (para usuarios sin Telegram membership)

### 2.6 Verificación
- [ ] Login con credenciales funciona (post DB migration)
- [ ] Login con Google funciona
- [ ] Login con Telegram valida membresía y crea/actualiza usuario
- [ ] Rutas protegidas redirigen a /login
- [ ] Admin puede acceder a /admin, customer no

---

## 🤖 SPRINT 3 — Bot de Telegram

### 3.1 Setup Bot
- [x] `bot/index.ts` con grammY (Long Polling)
- [x] Comandos: /start, /pedido <id>, /mispedidos, /ayuda
- [x] Rate limiting en memoria por usuario
- [ ] Configurar TELEGRAM_BOT_TOKEN en .env.local
- [ ] Test: `npm run bot` (requiere DATABASE_URL real)

### 3.2 Notificaciones (en lib/telegram.ts)
- [x] `notifyPurchase()` → mensaje en grupo al confirmar compra
- [x] `notifyNewProduct()` → alerta en grupo al publicar producto
- [x] `sendOrderStatusDM()` → DM al usuario al cambiar estado

### 3.3 Verificación
- [ ] Bot responde a /start en el grupo
- [ ] /pedido devuelve info correcta
- [ ] Webhook de pago llama a notifyPurchase y aparece en el grupo

---

## 🛍️ SPRINT 4 — Catálogo de Productos

### 4.1 API de Productos
- [ ] `app/api/products/route.ts` (GET con filtros, paginación)
- [ ] `app/api/products/[slug]/route.ts` (GET detalle)
- [ ] Lógica de early access (earlyAccessTierLevel)
- [ ] Lógica de productos exclusivos (exclusiveProducts en benefits)

### 4.2 Páginas de Catálogo
- [ ] `app/(store)/layout.tsx` (Navbar + Footer)
- [ ] `app/(store)/page.tsx` (Landing page con ShaderAnimation hero)
- [ ] `app/(store)/products/page.tsx` (grid con filtros)
- [ ] `app/(store)/products/[slug]/page.tsx` (ficha completa)

### 4.3 Componentes
- [ ] `components/layout/navbar.tsx`
- [ ] `components/layout/footer.tsx`
- [ ] `components/product/product-card.tsx` (glassmorphism)
- [ ] `components/product/product-grid.tsx`
- [ ] `components/product/product-gallery.tsx`
- [ ] `components/product/probability-table.tsx`

### 4.4 Verificación
- [ ] Catálogo muestra productos del seed
- [ ] Probabilidades visibles en la ficha de producto
- [ ] Early access bloquea correctamente según tier
- [ ] Productos exclusivos solo para tiers con exclusiveProducts: true

---

## 🛒 SPRINT 5 — Carrito & Checkout

### 5.1 Zustand Cart Store
- [x] `lib/hooks/use-cart.ts` (Zustand + LocalStorage persist)

### 5.2 UI del Carrito
- [ ] `components/cart/cart-drawer.tsx`
- [ ] `components/cart/cart-item.tsx`

### 5.3 Checkout Multi-step
- [ ] `app/(store)/checkout/page.tsx` (4 pasos)
- [ ] `components/checkout/checkout-form.tsx`
- [ ] `components/checkout/shipping-selector.tsx`

### 5.4 Lógica de Negocio
- [x] `lib/shipping.ts` (cálculo por peso + región)
- [x] `lib/coupon.ts` (validación + aplicación)
- [x] `lib/pro-logic.ts` (allowance deduction)
- [ ] `app/api/checkout/stripe/route.ts`
- [ ] `app/api/checkout/paypal/route.ts`
- [ ] `app/api/checkout/paypal/capture/route.ts`

### 5.5 Verificación
- [ ] Carrito persiste entre recargas
- [ ] Precio PRO se calcula correctamente
- [ ] Envío dinámico funciona
- [ ] Cupón aplica descuento

---

## 💳 SPRINT 6 — Pagos: Stripe + PayPal + Webhooks

### 6.1 Stripe
- [x] `lib/stripe.ts` (Stripe client)
- [ ] `app/api/checkout/stripe/route.ts` (Checkout Session)
- [ ] Soporte Apple Pay / Google Pay automático

### 6.2 PayPal
- [ ] Instalar PayPal SDK
- [ ] `lib/paypal.ts`
- [ ] `app/api/checkout/paypal/route.ts`
- [ ] `app/api/checkout/paypal/capture/route.ts`

### 6.3 Webhook Stripe (CRÍTICO)
- [ ] `app/api/webhooks/stripe/route.ts`
  - [ ] Verificar firma
  - [ ] `checkout.session.completed` → crear Order + stock - + allowance -
  - [ ] `invoice.paid` → refill allowance PRO + email renovación

### 6.4 Webhook PayPal
- [ ] `app/api/webhooks/paypal/route.ts`

### 6.5 Post-pago
- [ ] `app/(store)/order-success/page.tsx`

### 6.6 Verificación
- [ ] Pago Stripe de prueba crea Order en BD
- [ ] Stock se decrementa
- [ ] Email llega con PDF
- [ ] Bot notifica en grupo

---

## ⭐ SPRINT 7 — Suscripciones PRO

### 7.1 Stripe Subscriptions
- [ ] Crear Prices en Stripe con interval_count: 2 (bimestral)
- [ ] Actualizar stripePriceId en ProTiers de la BD
- [ ] `app/api/subscriptions/create/route.ts`
- [ ] `app/api/subscriptions/cancel/route.ts` (con bloqueo de permanencia)
- [ ] `app/api/subscriptions/change/route.ts`

### 7.2 Lógica de Permanencia
- [ ] Bloquear cancelación si proSince < 4 meses
- [ ] Mostrar fecha de cancelación posible en UI

### 7.3 Refill de Allowance
- [x] `lib/pro-logic.ts` tiene `refillProAllowance()`
- [ ] Conectar con webhook `invoice.paid`

### 7.4 Página de Precios
- [ ] `app/(store)/pricing/page.tsx` (tiers desde BD, sin hardcode)
- [ ] Tabla comparativa de benefits JSON

### 7.5 Verificación
- [ ] Suscripción crea isPro: true
- [ ] Allowance aparece en perfil
- [ ] Perks se aplican en checkout

---

## 👤 SPRINT 8 — Dashboard de Usuario

- [ ] `app/(store)/profile/page.tsx` (barra PRO, resumen)
- [ ] `app/(store)/profile/orders/page.tsx` (historial + tracking)
- [ ] `app/(store)/profile/addresses/page.tsx` (CRUD direcciones)
- [ ] `app/(store)/profile/settings/page.tsx` (config cuenta + eliminar)

---

## 🖥️ SPRINT 9 — Panel de Administración

### 9.1 Layout
- [ ] `app/(admin)/admin/layout.tsx` (sidebar responsivo)
- [ ] Verificación de role ADMIN en layout

### 9.2 Dashboard
- [ ] `app/(admin)/admin/page.tsx` (KPIs: ventas, pedidos, usuarios PRO, stock bajo)

### 9.3 Productos
- [ ] `app/(admin)/admin/products/page.tsx` (tabla filtrable)
- [ ] `app/(admin)/admin/products/new/page.tsx` (formulario completo)
- [ ] `app/(admin)/admin/products/[id]/edit/page.tsx`
- [ ] `components/admin/image-uploader.tsx` (dnd-kit para imágenes)
- [ ] Formulario de variantes (SKU, precios, stock, peso)
- [ ] Editor de probabilidades (JSON visual)
- [ ] Notificar al grupo cuando se publica un producto

### 9.4 Categorías
- [ ] `app/(admin)/admin/categories/page.tsx` (CRUD jerárquico)

### 9.5 Pedidos
- [ ] `app/(admin)/admin/orders/page.tsx` (filtros por estado)
- [ ] `app/(admin)/admin/orders/[id]/page.tsx`
  - [ ] Cambio de estado
  - [ ] Añadir tracking de Correos
  - [ ] Trigger email tracking al poner SHIPPED
  - [ ] Trigger DM Telegram al cambiar estado

### 9.6 Usuarios
- [ ] `app/(admin)/admin/users/page.tsx`
- [ ] `app/(admin)/admin/users/[id]/page.tsx`
  - [ ] Editar allowance PRO manualmente
  - [ ] Bloquear/desbloquear
  - [ ] Marcar/desmarcar isTelegramMember

### 9.7 PRO Tiers
- [ ] `app/(admin)/admin/pro-tiers/page.tsx` (CRUD completo, sin hardcode)
- [ ] Editor visual de benefits JSON
- [ ] Drag & drop para reordenar (dnd-kit)

### 9.8 Tarifas de Envío
- [ ] `app/(admin)/admin/shipping/page.tsx` (CRUD ShippingRates)
- [ ] Simulador de coste por peso

### 9.9 Cupones
- [ ] `app/(admin)/admin/coupons/page.tsx` (CRUD cupones)

### 9.10 Logs
- [ ] `app/(admin)/admin/logs/page.tsx` (AdminActionLog filtrable)

### 9.11 Componentes Reutilizables
- [ ] `components/admin/data-table.tsx` (tabla genérica con sort/filter/csv)
- [ ] `components/admin/stats-card.tsx` (KPI card)

---

## 📧 SPRINT 10 — Sistema de Emails

- [ ] `lib/resend.ts` (ya creado)
- [ ] `emails/order-confirmation.tsx` (React Email)
- [ ] `emails/invoice.tsx` (React Email + jsPDF adjunto)
- [ ] `emails/subscription-renewal.tsx`
- [ ] `emails/shipment-tracking.tsx`
- [ ] Integrar disparadores en webhooks y admin

---

## 📊 SPRINT 11 — Analytics & Monitoring

- [ ] GA4 en `app/layout.tsx`
- [ ] Sentry (`npx @sentry/wizard@latest -i nextjs`)
- [ ] Rate limiting en auth, checkout, webhooks
- [ ] Error boundaries en componentes críticos

---

## 🎨 SPRINT 12 — Diseño, Animaciones & UI Polish

- [ ] Hero con ShaderAnimation en landing page
- [ ] WaveBackground en sección de pricing
- [ ] Transiciones Framer Motion entre páginas
- [ ] ldrs loaders en operaciones async
- [ ] Revisión completa de accesibilidad (aria-labels, focus, contraste)
- [ ] Responsive: móvil, tablet, desktop

---

## 🧪 SPRINT 13 — Tests & QA

- [ ] `__tests__/lib/shipping.test.ts`
- [ ] `__tests__/lib/pro-logic.test.ts`
- [ ] `__tests__/lib/coupon.test.ts`
- [ ] `__tests__/lib/telegram.test.ts`
- [ ] Test webhook Stripe (mock)
- [ ] E2E tests con Playwright
- [ ] Audit de seguridad (headers, CSRF, roles)

---

## 🚀 SPRINT 14 — Deploy a Producción

- [ ] Vercel deployment + vars de entorno
- [ ] Neon BD de producción + migraciones
- [ ] Stripe Live keys + webhook URL producción
- [ ] PayPal producción
- [ ] Bot Telegram apuntando a producción
- [ ] Resend con dominio real verificado
- [ ] QA final en producción

---

## 🔮 BACKLOG — Ideas Futuras (Post-MVP)

- [ ] Sistema de reseñas/valoraciones de productos
- [ ] Wishlist / lista de deseos
- [ ] Notificaciones de "producto disponible" (stock out → restock alert)
- [ ] Programa de referidos
- [ ] Sorteos y preventas exclusivas para PRO
- [ ] API de Correos para generación automática de etiquetas
- [ ] App móvil (React Native o PWA)
- [ ] Soporte multi-idioma (i18n)
- [ ] Integración Discord además de Telegram
- [ ] Dashboard de analítica custom
- [ ] Chat de soporte integrado
- [ ] Randomización certificada con hash seed visible
- [ ] Historial de pulls / aperturas del usuario

---

> **Notas importantes:**
> - ⚠️ Prisma DEBE ser v6.0.1. Verificar antes de actualizar: `npm list prisma`
> - 📌 Los Planes PRO NUNCA son hardcoded — siempre vienen de la BD
> - 🤖 El bot de Telegram corre como proceso separado: `npm run bot`
> - 📝 Toda acción de administrador se registra en AdminActionLog
> - 🚫 Sin devoluciones — disclaimer visible en fichas de producto y checkout
> - 💰 El precio mostrado es €/mes aunque el cobro real sea bimestral (interval_count: 2)
