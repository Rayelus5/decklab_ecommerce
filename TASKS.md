# DECKLAB SHOP — TASKS.md

> Última actualización: 2026-05-27
> Estado del proyecto: Sprints 0-10 completados — iniciando Sprint 11 (Analytics & Monitoring)
> Leyenda: `[ ]` Pendiente | `[x]` Completado | `[~]` En progreso | `[!]` Bloqueado | `[s]` Saltado

---

## 🏗️ SPRINT 0 — Infraestructura & Setup ✅

### 0.1 Inicialización del Proyecto
- [x] Crear proyecto Next.js 16 con App Router y TypeScript → v16.2.6
- [x] Configurar `tsconfig.json` con `strict: true` y path alias `@/*`
- [x] Configurar Tailwind CSS v4 con tokens del DESIGN.md
- [x] Configurar ESLint 9 con reglas Next.js
- [s] Prettier — ESLint cubre el formato suficientemente
- [x] Crear `.env.example` con todas las variables documentadas
- [~] Crear `.env.local` con valores de desarrollo (⚠️ RELLENAR CON VARIABLES REALES)
- [x] Crear `README.md` inicial

### 0.2 Dependencias
- [x] Next 16.2.6, React 19.2.4, TypeScript, Tailwind v4
- [x] Prisma v6.0.1 + @prisma/client ✅ VERSIÓN VERIFICADA
- [x] NextAuth v5 beta + @auth/prisma-adapter
- [x] bcryptjs, Stripe, Zustand v5, Framer Motion, Lucide React
- [x] ldrs, @dnd-kit, React Hook Form + Zod v4
- [x] Resend + React Email + jsPDF + jspdf-autotable
- [x] grammY, three, simplex-noise, decimal.js, date-fns, Sonner, clsx
- [x] @neondatabase/serverless, Sentry
- [ ] PayPal SDK — pendiente (Sprint 6.2)

### 0.3–0.6 Estructura, componentes UI y configuración
- [x] Estructura completa de carpetas creada
- [x] `lib/prisma.ts`, `lib/auth.ts`, `lib/stripe.ts`, `lib/resend.ts`
- [x] `lib/telegram.ts`, `lib/shipping.ts`, `lib/pro-logic.ts`, `lib/coupon.ts`
- [x] `lib/hooks/use-cart.ts` (Zustand + LocalStorage)
- [x] `proxy.ts` (protección de rutas + Telegram gate, Next.js 16)
- [x] `components/ui/shader-animation.tsx` (Three.js hero)
- [x] `components/ui/wave-background.tsx` (simplex-noise)
- [x] `components/ui/` base: button, input, badge, card
- [x] Bot: `bot/index.ts` con grammY
- [x] API auth: nextauth, telegram callback, register

---

## 🗄️ SPRINT 1 — Schema & Base de Datos ✅ (pendiente ejecutar)

### 1.1 Schema Prisma
- [x] Schema completo con todos los modelos (User, Address, Product, ProductVariant, ProductImage, ProTier, ShippingRate, Coupon, Order, OrderItem, Shipment, AdminActionLog, Category, Account, Session)
- [x] Enums: UserRole, ShippingRegion, OrderStatus
- [x] Índices en campos de búsqueda frecuente

### 1.2 Migraciones
- [!] ⚠️ RELLENAR `.env.local` CON `DATABASE_URL` REAL (Neon)
- [ ] Ejecutar `npm run db:migrate` (primera migración)
- [ ] Verificar schema en Neon / Prisma Studio

### 1.3 Seed Data
- [x] `prisma/seed.ts` con admin, 5 ProTiers, 14 ShippingRates, 4 categorías, producto demo
- [ ] Ejecutar `npm run db:seed`

---

## 🔐 SPRINT 2 — Autenticación ✅ (pendiente conectar DB)

- [x] NextAuth v5 config (credentials + Google + custom session con role, isPro, proTierId)
- [x] Telegram Login Widget + verificación HMAC + checkGroupMembership
- [x] `app/(auth)/login/page.tsx` + `register/page.tsx` + layout centrado
- [x] `components/auth/login-form.tsx`, `register-form.tsx`, `telegram-login-button.tsx`
- [x] `proxy.ts` protege rutas + verifica isTelegramMember
- [x] `app/acceso-privado/page.tsx`
- [!] ⚠️ Bot domain invalid en Telegram Widget — necesita `/setdomain` en BotFather (dominio: `decklab.rayelus.com`) o ngrok para dev
- [ ] Verificar login con credenciales (post DB migration)
- [ ] Verificar login con Google (necesita GOOGLE_CLIENT_ID real)
- [ ] Verificar login con Telegram (necesita bot domain configurado + DB real)

---

## 🤖 SPRINT 3 — Bot de Telegram ✅

- [x] `bot/index.ts`: /start, /pedido, /mispedidos, /ayuda + rate limiting
- [x] `notifyPurchase()`, `notifyNewProduct()`, `sendOrderStatusDM()`
- [ ] Test end-to-end (requiere DB real + TELEGRAM_BOT_TOKEN)

---

## 🛍️ SPRINT 4 — Catálogo de Productos ✅

- [x] `app/api/products/route.ts` (GET con filtros, paginación, early access, exclusivos)
- [x] `app/(store)/products/page.tsx` (SSR grid + filtros client)
- [x] `app/(store)/products/[slug]/page.tsx` (galería, variantes, precio PRO, probabilidades)
- [x] `components/product/product-card.tsx` — diseño premium con pill PRO palpitante
- [x] `components/product/product-actions.tsx` — pill PRO palpitante visible a todos
- [x] `components/product/product-filters.tsx`, `probability-table.tsx`
- [x] `components/layout/navbar.tsx`, `footer.tsx`
- [s] `product-gallery.tsx` — simplificado directamente en la página

---

## 🛒 SPRINT 5 — Carrito & Checkout ✅

- [x] `lib/hooks/use-cart.ts` (Zustand + persist localStorage)
- [x] `components/cart/cart-drawer.tsx`, `cart-item.tsx`
- [x] `app/(store)/cart/page.tsx`
- [x] `app/(store)/checkout/page.tsx` (SSR) + `components/checkout/checkout-client.tsx` (4 pasos)
- [x] `app/(store)/order-success/page.tsx`
- [x] `lib/shipping.ts`, `lib/coupon.ts`, `lib/pro-logic.ts`
- [x] `app/api/checkout/stripe/route.ts` (Checkout Session con metadata PRO)
- [x] `app/api/coupons/validate/route.ts`
- [ ] `app/api/checkout/paypal/route.ts` — Sprint 6

---

## 💳 SPRINT 6 — Pagos ✅ (Stripe) / Pendiente (PayPal)

### Stripe ✅
- [x] `app/api/webhooks/stripe/route.ts`:
  - [x] Verificación de firma
  - [x] `checkout.session.completed` → Order + stock - + allowance - + cupón + email + Telegram
  - [x] `invoice.paid` → refillProAllowance + email renovación

### PayPal (pendiente)
- [ ] Instalar PayPal SDK
- [ ] `lib/paypal.ts`
- [ ] `app/api/checkout/paypal/route.ts` + `/capture`
- [ ] `app/api/webhooks/paypal/route.ts`

### Verificación (requiere DB + Stripe test keys)
- [ ] Pago Stripe de prueba (tarjeta 4242...) crea Order
- [ ] Stock decrementado, allowance deducido
- [ ] Email de confirmación con PDF llega
- [ ] Bot notifica en grupo

---

## ⭐ SPRINT 7 — Suscripciones PRO (parcial)

- [x] `lib/pro-logic.ts` con `refillProAllowance()` → integrado en webhook `invoice.paid`
- [ ] Crear Stripe Prices bimestrales (interval_count: 2) para cada ProTier
- [ ] Actualizar `stripePriceId` en ProTiers de la BD
- [ ] `app/api/subscriptions/create/route.ts`
- [ ] `app/api/subscriptions/cancel/route.ts` (bloqueo de permanencia mínima 4 meses)
- [ ] `app/api/subscriptions/change/route.ts`
- [ ] `app/(store)/pricing/page.tsx` (tiers desde BD, tabla de benefits)

---

## 👤 SPRINT 8 — Dashboard de Usuario ✅

- [x] `app/(store)/profile/page.tsx` (barra PRO, resumen de cuenta, accesos rápidos)
- [x] `app/(store)/profile/orders/page.tsx` (historial con badges de estado)
- [x] `app/(store)/profile/orders/[id]/page.tsx` (detalle con step-tracker, tracking, items)
- [x] `app/(store)/profile/addresses/page.tsx` + `components/profile/addresses-manager.tsx` (CRUD completo)
- [x] `app/(store)/profile/settings/page.tsx` + `components/profile/settings-client.tsx` (nombre, password, suscripción)
- [x] `app/api/addresses/route.ts` + `[id]/route.ts`
- [x] `app/api/user/profile/route.ts` (nombre + cambio de contraseña con bcrypt)

---

## 🖥️ SPRINT 9 — Panel de Administración ✅

### Layout & Auth
- [x] `app/(admin)/layout.tsx` (verificación ADMIN + redirect)
- [x] `components/admin/admin-sidebar.tsx` (9 secciones, isActive por ruta)

### Dashboard
- [x] `app/(admin)/admin/page.tsx` (KPIs: ventas hoy/mes, pedidos pendientes, usuarios PRO, stock bajo, últimos pedidos)

### Productos
- [x] `app/(admin)/admin/products/page.tsx` (tabla con búsqueda, paginación, archived toggle)
- [x] `app/(admin)/admin/products/new/page.tsx`
- [x] `app/(admin)/admin/products/[id]/edit/page.tsx`
- [x] `components/admin/product-form.tsx` (variantes, imágenes por URL con preview/reorder/delete, archivar/restaurar)
- [x] `app/api/admin/products/route.ts` (POST con imágenes)
- [x] `app/api/admin/products/[id]/route.ts` (PATCH con imágenes + soft delete)

### Pedidos
- [x] `app/(admin)/admin/orders/page.tsx` (filtros por estado, búsqueda)
- [x] `app/(admin)/admin/orders/[id]/page.tsx` + `order-actions.tsx` (cambio estado, tracking, carrier)
- [x] `app/api/admin/orders/[id]/route.ts` (estado + shipment upsert + Telegram DM + email tracking)

### Usuarios
- [x] `app/(admin)/admin/users/page.tsx`
- [x] `app/(admin)/admin/users/[id]/page.tsx` (allowance manual, isTelegramMember, role)
- [x] `app/api/admin/users/[id]/route.ts`

### PRO Tiers
- [x] `app/(admin)/admin/pro-tiers/page.tsx` + CRUD con editor visual de benefits JSON
- [x] `app/api/admin/pro-tiers/[id]/route.ts`

### Tarifas de Envío
- [x] `app/(admin)/admin/shipping/page.tsx` (CRUD ShippingRates con tipo, región, peso, precio)

### Cupones
- [x] `app/(admin)/admin/coupons/page.tsx` (CRUD: tipo PERCENT/FIXED, límites, expiración)

### Categorías
- [x] `app/(admin)/admin/categories/page.tsx` (CRUD jerárquico con slug auto)

### Logs
- [x] `app/(admin)/admin/logs/page.tsx` (AdminActionLog con filtros y badges por tipo)

### Reutilizables
- [x] `components/admin/data-table.tsx` (tabla genérica con search, sort, pagination)
- [x] `components/admin/stats-card.tsx` (KPI card con colores: default, amber, mint, blue, red)

---

## 📧 SPRINT 10 — Sistema de Emails ✅

- [x] `lib/resend.ts` (cliente Resend)
- [x] `emails/order-confirmation.tsx` (React Email — resumen pedido, dirección, totales)
- [x] `emails/shipment-tracking.tsx` (React Email — número tracking Correos + botón rastreo)
- [x] `emails/subscription-renewal.tsx` (React Email — stats allowance, badge PRO)
- [x] `lib/pdf.ts` (factura PDF con jsPDF + autotable, colores DECKLAB)
- [x] `lib/email.ts` (helpers: sendOrderConfirmationEmail, sendShipmentTrackingEmail, sendSubscriptionRenewalEmail)
- [x] Webhook Stripe integrado: email confirmación+PDF en `checkout.session.completed`, renovación en `invoice.paid`
- [x] API admin orders integrada: email tracking al pasar a SHIPPED
- [ ] Verificar que emails llegan (requiere RESEND_API_KEY real + dominio verificado en Resend)
- [ ] Verificar que PDF se adjunta correctamente

---

## 📊 SPRINT 11 — Analytics & Monitoring

- [ ] GA4: integrar script en `app/layout.tsx` con NEXT_PUBLIC_GA_MEASUREMENT_ID
- [ ] Eventos personalizados: add_to_cart, begin_checkout, purchase, sign_up
- [ ] Sentry: `npx @sentry/wizard@latest -i nextjs` + SENTRY_DSN en .env
- [ ] Error boundaries en checkout, carrito, auth
- [ ] Rate limiting en /api/auth/*, /api/checkout/*, /api/webhooks/*

---

## 🎨 SPRINT 12 — Diseño, Animaciones & UI Polish

- [x] Hero con ShaderAnimation en landing page
- [x] WaveBackground en secciones
- [x] ProductCard premium (aspect 4/3, precio dominante, hover levitation, pill PRO palpitante)
- [ ] Transiciones Framer Motion entre páginas (layout animations)
- [ ] ldrs loaders en botones de pago y operaciones async
- [ ] Skeleton screens para listas
- [ ] `app/(store)/pricing/page.tsx` (con WaveBackground + comparativa tiers)
- [ ] Revisión accesibilidad: aria-labels, focus management, contraste WCAG AA
- [ ] Responsive audit: 375px / 768px / 1440px

---

## 🧪 SPRINT 13 — Tests & QA

- [ ] `__tests__/lib/shipping.test.ts`
- [ ] `__tests__/lib/pro-logic.test.ts`
- [ ] `__tests__/lib/coupon.test.ts`
- [ ] `__tests__/lib/telegram.test.ts` (mock HMAC)
- [ ] Test webhook Stripe (evento mock → verificar Order creado)
- [ ] E2E con Playwright: flujo completo login → carrito → checkout → order-success
- [ ] Audit de seguridad: headers, CSRF, roles admin

---

## 🚀 SPRINT 14 — Deploy a Producción

- [ ] Vercel: conectar repo + todas las vars de entorno
- [ ] Neon producción: `npx prisma migrate deploy` + seed de producción
- [ ] Stripe Live: claves live + webhook endpoint `decklab.rayelus.com/api/webhooks/stripe`
- [ ] PayPal producción (si implementado en Sprint 6)
- [ ] BotFather: `/setdomain` → `decklab.rayelus.com`
- [ ] Resend: verificar dominio `decklab.rayelus.com`
- [ ] QA final: compra real de prueba end-to-end

---

## 🔮 BACKLOG — Ideas Futuras (Post-MVP)

- [ ] Sistema de reseñas/valoraciones
- [ ] Wishlist / lista de deseos
- [ ] Notificaciones de restock
- [ ] Programa de referidos
- [ ] Sorteos y preventas exclusivas PRO
- [ ] API de Correos para etiquetas automáticas
- [ ] PWA / App móvil
- [ ] Soporte multi-idioma (i18n)
- [ ] Discord además de Telegram
- [ ] Dashboard de analítica custom
- [ ] Chat de soporte integrado
- [ ] Randomización certificada con hash seed visible

---

> **Notas importantes:**
> - ⚠️ Prisma DEBE ser v6.0.1 — verificar: `npm list prisma`
> - 📌 Los Planes PRO NUNCA son hardcoded — siempre vienen de la BD
> - 🤖 El bot corre como proceso separado: `npm run bot`
> - 📝 Toda acción de administrador se registra en AdminActionLog
> - 🚫 Sin devoluciones — disclaimer visible en fichas y checkout
> - 💰 Precio mostrado: €/mes | Cobro real: bimestral (interval_count: 2)
> - 🌐 Dominio: `decklab.rayelus.com` | BotFather domain: configurar con `/setdomain`
