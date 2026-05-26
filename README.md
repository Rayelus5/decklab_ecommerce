Aquí tienes el resumen completo del proyecto formateado en Markdown. Puedes copiar este contenido y guardarlo como `RESUMEN.md` o usarlo como tu `README.md` principal en GitHub.

```markdown
# 🃏 DECKLAB SHOP - Resumen Técnico del Proyecto

**DECKLAB SHOP** es una plataforma de comercio electrónico profesional, escalable y moderna, diseñada específicamente para la venta de artículos de Cardistry, Magia y accesorios premium. Su característica diferenciadora es un sistema de suscripción escalonada (Tiers) que otorga un "Poder de Compra PRO" a los usuarios.

## 🛠 Stack Tecnológico

El proyecto está construido sobre una arquitectura moderna y robusta:

*   **Frontend / Framework:** Next.js 16 (App Router) + React 19.
*   **Lenguaje:** TypeScript (Strict Mode).
*   **Estilos:** Tailwind CSS (Diseño oscuro, minimalista, "Apple-like").
*   **Base de Datos:** PostgreSQL alojado en [Neon.tech](https://neon.tech/).
*   **ORM:** Prisma v6.
*   **Autenticación:** NextAuth.js (v5 beta) con Credenciales y Google OAuth.
*   **Gestión de Estado (Carrito):** Zustand + Persistencia en LocalStorage.
*   **Pagos y Suscripciones:** Stripe (Checkout Sessions & Webhooks).
*   **Iconos y UI:** Lucide React, componentes custom, `ldrs` (loaders).

---

## 🧠 Lógica de Negocio Principal

### 1. Sistema de Suscripción PRO (Tiers)
A diferencia de un descuento global, DECKLAB SHOP utiliza un sistema de **"Capacidad Mensual"**.
*   Existen 5 niveles de suscripción (gestionados mediante Stripe Subscriptions).
*   Cada nivel tiene un precio mensual y otorga un **`monthlyAllowance` (Saldo PRO)**.
*   El usuario PRO puede comprar productos a un precio drásticamente reducido (`pricePro`).
*   Al comprar, el valor del producto (a precio PRO) se descuenta de su "Saldo PRO" mensual. Si el saldo se agota, paga el precio normal. El saldo no consumido se acumula para el futuro.

### 2. Motor de Envíos Dinámico
*   Los envíos se calculan en base al **peso total** del carrito (en gramos) y la **región** (Nacional vs. Europa).
*   Soporta diferentes métodos (Ordinario, Certificado) mapeados dinámicamente desde la base de datos.

---

## 🗄️ Esquema de Base de Datos (Resumen)

El esquema Prisma gestiona todas las relaciones complejas:
*   **User / Account / Session:** Gestión de autenticación y roles (`ADMIN`, `CUSTOMER`). Incluye balance PRO y Stripe ID.
*   **ProTier:** Definición de los 5 niveles (Precio mensual, límite de saldo, ID de Stripe).
*   **Product / ProductVariant / ProductImage / Category:** Catálogo jerárquico. Las variantes manejan stock, peso y el doble sistema de precios (`price`, `pricePro`).
*   **Order / OrderItem / Shipment:** Trazabilidad completa de las compras. `OrderItem` registra si el artículo se compró usando beneficio PRO.
*   **Address:** Direcciones de envío del usuario con soporte múltiple y flags de defecto.
*   **ShippingRate:** Reglas de envío por peso (min/max) y región.

---

## 🚀 Módulos Implementados (Sprints Completados)

### Sprint 1: Setup y Autenticación
- [x] Configuración inicial (Next.js, Tailwind, Prisma).
- [x] Conexión a Neon PostgreSQL y script de `seed.ts` para datos maestros (Tiers, Shipping).
- [x] Auth universal (Login/Registro) con contraseñas encriptadas (`bcryptjs`).
- [x] Navbar dinámico con detección de estado PRO.

### Sprint 2: Catálogo y Carrito
- [x] Base de datos de productos poblándose mediante seed.
- [x] Grilla de productos (`/products`) y Ficha de detalle (`/products/[slug]`).
- [x] Carrito global y reactivo usando **Zustand**.
- [x] Slide/Vista del carrito (`/cart`) mostrando el "ahorro potencial" y consumo de saldo PRO en tiempo real.

### Sprint 3: Checkout y Pagos (Stripe)
- [x] Formulario multi-paso de tramitación de pedido (`/checkout`).
- [x] Cálculo en servidor de tarifas de envío según el país y peso total.
- [x] Integración de **Stripe Checkout** para pagos seguros con tarjeta/wallets.

### Sprint 4: Webhooks y Transacciones Seguras
- [x] Endpoint seguro `/api/webhooks/stripe` para escuchar eventos de Stripe.
- [x] Creación de `Order` y `OrderItems` en DB de forma asíncrona y segura.
- [x] **Deducción de Stock** atómica.
- [x] Consumo y descuento automático del **Saldo PRO** (`proAllowanceBalance`) del usuario tras el pago.

### Sprint 5: Suscripciones, Perfil y Home
- [x] Landing Page (`/`) optimizada, con Hero section, beneficios y productos destacados.
- [x] Página de Pricing (`/pricing`) integrada con **Stripe Subscriptions** para vender los 5 niveles PRO.
- [x] Dashboard de Usuario (`/profile`) tipo panel financiero mostrando la barra de progreso del consumo PRO y el historial de pedidos.
- [x] Ajustes de Perfil (`/profile/settings`) para cambio de datos y contraseña.
- [x] Gestión de Direcciones (`/profile/addresses`) para guardar y eliminar múltiples puntos de envío.
- [x] **Eliminación Segura de Cuenta:** Borrado en cascada y cancelación automática del cliente en Stripe.

---

## 🔜 Próximos Pasos (Roadmap Sugerido)

El flujo de cara al cliente está completado. Las siguientes fases recomendadas son:

1.  **Panel de Administración (`/admin`):**
    *   Dashboard analítico (ventas, usuarios activos).
    *   CRUD completo para crear/editar productos, variantes y stock desde la UI.
    *   Gestión de pedidos y actualización de estados de envío (Añadir tracking number de Correos).
2.  **Sistema de Correos (Emails):**
    *   Integración con Resend + React Email para correos de confirmación de pedido, bienvenida y alertas de renovación de suscripción.
3.  **Despliegue y CI/CD:**
    *   Despliegue de la base de datos de producción.
    *   Despliegue de la web en Vercel.
    *   Configurar Webhooks de Stripe en entorno de producción.

```