# DECKLAB SHOP — Documento de Contexto General

> Referencia interna de arquitectura, lógica de negocio y estado del sistema.
> Última actualización: junio 2026.

---

## Qué es DECKLAB Shop

E-commerce de cartas coleccionables (TCG) con una capa de gamificación Pokémon integrada. El modelo de negocio combina ventas directas con una suscripción mensual (plan PRO) que da acceso a precios especiales, productos exclusivos y un sistema de moneda virtual. La gamificación fideliza al usuario: incubar y coleccionar Pokémon está ligado a la actividad en la tienda.

---

## 1. CATÁLOGO Y TIENDA

### Productos
- Cada `Product` tiene una o más `ProductVariant` con precio público (`price`) y precio PRO opcional (`pricePro`).
- Campo `weight` en la variante (en gramos) — crítico para cálculo de envíos y consolidación.
- Campo `probabilityData` (JSON) para mostrar tablas de probabilidades en booster boxes ("45% Raro", "5% Ultra Raro"…).
- `noReturns: true` hardcodeado — sin devoluciones, visible en la ficha de producto.
- Control de stock: `stock` (disponible) + `reservedStock` (bloqueado durante checkout activo, se libera si el usuario abandona).

### Acceso y visibilidad
- `earlyAccessTierLevel` — el producto solo es visible para usuarios con tier PRO ≥ N horas antes del lanzamiento general.
- `isExclusive` — solo visible para tiers PRO con `benefits.exclusiveProducts: true`.
- `proExempt` en variante — comprar a precio PRO NO descuenta del allowance mensual (coste asumido por el negocio).

### Categorías
- Árbol de categorías con soporte de subcategorías (`parentId`).
- Página de catálogo con filtros por categoría, acceso early access visible solo si el tier lo permite.

### Reservas anticipadas (`ReservationPeriod`)
- Ventana de tiempo (`opensAt` / `closesAt`) vinculada a productos específicos.
- Cupón de descuento asociado (opcional).
- Badge personalizable ("RESERVA", "PRE-ORDER"…) + popup en la página de catálogo.
- `maxUnits` = plazas visibles; `spotsRemaining` se calcula en runtime con `coupon.usesCount`.

---

## 2. PEDIDOS Y CHECKOUT

### Flujo de checkout (3 pasos)
1. **Dirección** — el usuario selecciona una dirección guardada o introduce una nueva. Determina la región de envío (`NATIONAL` / `EUROPE`).
2. **Envío** — listado de tarifas disponibles para esa región y peso. Aquí también aparece la opción de "Unificar pedido" si hay pedidos elegibles.
3. **Pago** — resumen final + sesión Stripe Checkout.

### Tarifas de envío (`ShippingRate`)
- Definidas por admin: `type` (ORDINARIO / CERTIFICADO), `region`, `minWeight`, `maxWeight` (en gramos), `price`.
- `maxWeight: -1` = sin límite superior.
- El checkout calcula el coste buscando la tarifa activa que cubre el peso total del carrito.

### Cupones de descuento (`Coupon`)
- Tipos: `PERCENT` (porcentaje) o `FIXED` (cantidad fija en €).
- Restricciones: `minOrderAmount`, `maxUses` globales, `maxUsesPerUser`, `expiresAt`.
- Aplicabilidad: por `productIds` o `categoryIds` (vacío = aplica a todo).

### Consolidación de envíos
El usuario puede unificar el nuevo pedido con uno activo (`PAID` / `PROCESSING`) para pagar solo la diferencia de tarifa.

**Reglas:**
- Solo pedidos de la misma región.
- `existingWeight + cartWeight` → busca tarifa aplicable (primero mismo tipo, luego cualquier tipo).
- `difference = max(0, newRate.price - originalOrder.shippingCost)` → puede ser €0 si el peso combinado sigue en el mismo tramo.
- El nuevo `Order` guarda `consolidatedWithOrderId` apuntando al pedido base.
- Un pedido base puede tener múltiples pedidos secundarios pero los secundarios no pueden consolidar con otros secundarios (sin encadenamiento).

**Admin:** puede vincular/desvincular consolidaciones manualmente desde el panel de pedido.

### Lifecycle del pedido
```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
                                      → CANCELLED
                                      → REFUNDED
```
- `PAID` lo activa el webhook de Stripe (no el usuario).
- `SHIPPED` lo activa el admin al introducir el número de tracking.
- Los reembolsos se gestionan vía Stripe y el webhook actualiza el estado.

### Webhooks Stripe
- `checkout.session.completed` → crea `Order` + `OrderItem[]`, decrementa stock, consume allowance PRO si aplica, actualiza stats VIP, crea `Shipment`.
- `invoice.paid` → recarga allowance PRO en renovaciones bimestrales.
- `customer.subscription.deleted` → desactiva PRO del usuario.
- `charge.refunded` → marca pedido como `REFUNDED`.
- Idempotencia: se verifica si el pedido ya existe antes de crearlo de nuevo.

### Carritos abandonados (`AbandonedCart`)
- Se registra cuando el usuario inicia el checkout de Stripe pero no completa el pago.
- Snapshot del carrito + subtotal.
- `recoveryEmailSentAt` / `convertedAt` para seguimiento.
- El admin puede verlos en `/admin/abandoned-carts`.

---

## 3. SISTEMA PRO (SUSCRIPCIÓN)

### Tiers PRO (`ProTier`)
Gestionados desde el admin, no hardcodeados. Campos clave:
- `priceMonthly` — precio mostrado al usuario (€/mes).
- `monthlyAllowance` — saldo de compra mensual en €.
- `stripePriceId` — precio de Stripe. **La suscripción se cobra bimestralmente** (`interval_count: 2`).
- `benefits` (JSON):
  ```json
  {
    "earlyAccessHours": 48,
    "freeShipping": false,
    "exclusiveProducts": false,
    "bonusAllowancePercent": 10
  }
  ```

### Allowance (saldo de compra)
- `proAllowanceBalance` en el usuario — acumulable, no se resetea al renovar sino que se suma.
- En cada renovación bimestral: se recarga `monthlyAllowance × (1 + bonusPercent/100) × 2`.
- El saldo sirve para pagar productos a precio PRO y para comprar Pokémonedas.

### Cálculo de precios con allowance
Por cada item del carrito:
1. Si `isPro` y `pricePro < price`:
   - Si `proExempt = true` → usar `pricePro` sin tocar el allowance.
   - Si `proExempt = false` y `allowance ≥ pricePro × quantity` → usar `pricePro`, descontar del allowance.
   - Si `allowance` insuficiente → usar `price` normal.
2. Si no es PRO → `price` normal siempre.

El campo `wasProPrice` en `OrderItem` registra si se aplicó precio PRO (para auditoría y futuros reembolsos).

### Flujo de suscripción
```
Usuario elige tier en /pricing
  → POST /api/subscriptions/create → Stripe Checkout (mode: subscription)
  → Stripe cobra (bimestral)
  → Webhook: checkout.session.completed
     → isPro = true, proTierId, proSubscriptionId
     → refillProAllowance()
     → Si es cambio de plan: cancela suscripción anterior
```

### Cambio y cancelación
- Cambio de tier: `/api/subscriptions/change` — crea nueva suscripción, la anterior se cancela al confirmar el webhook.
- Cancelación: `/api/subscriptions/cancel` — puede ser inmediata o al final del período actual.
- `proSince` se preserva para calcular permanencia mínima de 2 ciclos (4 meses).

---

## 4. SISTEMA VIP (BASADO EN GASTO)

### Tiers VIP (`VipTier`)
Gestionados desde el admin. Campos:
- `level` (único), `name`, `color`, `iconImage`.
- `minSpent` (€ gastados históricos) + `minOrders` (número de pedidos pagados) — ambos deben cumplirse.
- `cashbackPercent` — % del total de cada pedido que se abona como saldo PRO.
- `perks` (JSON) — beneficios adicionales libres.

### Progresión automática
Tras cada pago confirmado (webhook):
1. `totalSpent += orderTotal`, `totalOrdersCount++`.
2. Se busca el tier más alto que cumple ambos requisitos.
3. Si hay tier → `vipTierId` se actualiza + se abona cashback a `proAllowanceBalance`.

### Recálculo manual
Desde `/admin/vip-tiers` hay un botón que recalcula todos los usuarios basándose en su historial real de pedidos pagados (útil si se cambian los umbrales de los tiers).

### Visualización
`VipCard3D` en el perfil del usuario — muestra el tier actual con efecto 3D, color y nombre del tier.

---

## 5. GAMIFICACIÓN POKÉMON

### Concepto general
La gamificación refuerza la fidelización: los usuarios obtienen huevos a través de códigos promocionales (distribuidos en eventos, redes sociales, pedidos especiales). Los huevos se incuban en tiempo real y eclosionan dando un Pokémon de la Generación 1. Los Pokémon se guardan en cajas coleccionables.

### Ciclo completo
```
Admin genera PromoCode (con rareza) 
  → Usuario canjea en /promotion
  → PokemonEgg (status: INVENTORY) aparece en /profile/inventory
  → Usuario inicia incubación → status: INCUBATING + timestamp
  → Timer llega a 0 → Usuario eclosiona → PokemonInstance
  → Pokémon asignado a caja/slot disponible
```

---

### 5.1 Códigos promocionales (`PromoCode`)

**Estructura:**
- `code` (único) — formato libre, el admin lo define.
- `rewardType` — actualmente solo `EGG`.
- `rarity` — `COMMON | UNCOMMON | RARE | EPIC | LEGENDARY | MYTHIC`.
- `isUsed` + `usedById` + `usedAt` — trazabilidad de quién y cuándo.

**Generación (admin):**
- `/admin/promocodes` — se indica rareza, cantidad y prefijo base.
- Se generan N códigos con sufijos aleatorios.
- Un mismo usuario puede canjear múltiples códigos (no hay límite por usuario, solo por código).

**Canje (usuario):**
- `/promotion` — input de código, validación en servidor.
- Si válido: se marca como usado + se crea el huevo en el inventario.
- Confetti animado al éxito, redirige a `/profile/inventory`.

---

### 5.2 Huevos (`PokemonEgg`)

**Estados:**
- `INVENTORY` — en el inventario del usuario, esperando incubación.
- `INCUBATING` — en la incubadora, timer activo.
- `HATCHED` — eclosionado, tiene `PokemonInstance` asociado.

**Tiempos de incubación:**
| Rareza | Tiempo |
|--------|--------|
| COMMON | 30 minutos |
| UNCOMMON | 1 hora |
| RARE | 3 horas |
| EPIC | 8 horas |
| LEGENDARY | 24 horas |
| MYTHIC | 24 horas |

---

### 5.3 Incubadora (`UserIncubator`)

- Tipo actual: `INFINITE` — se crea automáticamente la primera vez que el usuario intenta incubar.
- Capacidad: **1 huevo activo a la vez**.
- `usesLeft` existe en el schema para incubadoras con usos limitados (futuro).

---

### 5.4 Pokémon (`PokemonInstance`)

- Generación 1 únicamente: Pokédex 1–151 (aleatorio al eclosionar).
- `boxNumber` + `slotNumber` — ubicación en el sistema de cajas.
- `stats` (JSON): `{ hp, attack, defense }` generados aleatoriamente (0-31 por stat). **WIP — no hay sistema de combate aún**.
- Movimiento libre entre cajas/slots mediante `movePokemon()`.

---

### 5.5 Sistema de cajas (`boxesUnlocked`)

- El usuario empieza con **8 cajas desbloqueadas**.
- Cada caja tiene **30 slots** (grid 6×5).
- Capacidad inicial: 8 × 30 = 240 Pokémon.
- Desbloqueo automático: cuando el usuario tiene al menos 1 Pokémon en **cada una** de sus cajas actuales, se desbloquean **+8 cajas** (máximo 24 cajas = 720 slots).
- Progresión: 8 → 16 → 24 cajas.

---

### 5.6 Pokémonedas (`pokemonedas`)

Moneda virtual del sistema. Actúa como puente entre el allowance PRO y la gamificación.

**Compra (allowance → Pokémonedas):**
- Conversión: **1 € = 1.000 Pokémonedas**.
- Packs: 1€/1K · 3€/3K · 5€/5K · 10€/10K.
- Requiere saldo PRO suficiente (decrementa `proAllowanceBalance`).

**Canje (Pokémonedas → allowance):**
- Conversión: **1.500 Pokémonedas = 1 €** (tipo de cambio desfavorable para desincentivar el arbitraje).
- Packs: 1€/1.5K · 5€/7.5K · 10€/15K.

**Uso futuro:** la tienda de objetos consumirá Pokémonedas directamente (ver sección 7).

---

## 6. ADMINISTRACIÓN (Panel Admin)

### Acceso
Solo usuarios con `role: ADMIN`. Ruta base: `/admin`.

### Módulos disponibles

| Módulo | Ruta | Funcionalidad |
|--------|------|---------------|
| Pedidos | `/admin/orders` | Listado paginado, filtros por estado, badges de consolidación, cambio de estado, refunds, notificación Telegram, gestión de consolidaciones |
| Productos | `/admin/products` | CRUD completo, imágenes, variantes, precios PRO, probabilidades |
| Categorías | `/admin/categories` | Árbol de categorías |
| Usuarios | `/admin/users` | Listado, gestión de bloqueo, ver detalles, editar datos |
| Tiers PRO | `/admin/pro-tiers` | CRUD de planes PRO, beneficios, precio Stripe |
| Tiers VIP | `/admin/vip-tiers` | CRUD de tiers VIP, recálculo masivo |
| Cupones | `/admin/coupons` | CRUD de descuentos |
| Reservas | `/admin/reservations` | CRUD de períodos de reserva anticipada |
| Tarifas de envío | `/admin/shipping` | CRUD de tarifas por peso/región/tipo |
| Códigos promo | `/admin/promocodes` | Generación masiva de códigos con rareza |
| Carritos abandonados | `/admin/abandoned-carts` | Visualización y seguimiento |
| Logs | `/admin/logs` | Auditoría de acciones admin (`AdminActionLog`) |

### Notificaciones Telegram
El admin puede enviar una notificación manual al bot de Telegram al gestionar un pedido (tracking, estado). El bot también recibe eventos automáticos desde los webhooks.

---

## 7. ESTADO ACTUAL: QUÉ ESTÁ WIP

### 7.1 Tienda de Objetos (`ItemsShopWip`)
Visible pero bloqueada con overlay "En Construcción". Objetos planificados:

| Objeto | Precio |
|--------|--------|
| Ticket de Expansión de Caja | 5.000 PKM |
| Mejora de Incubadora | 15.000 PKM |
| Huevo Misterioso | 3.000 PKM |

**Pendiente:** lógica de compra, inventario de objetos del usuario, efectos al usar cada objeto.

### 7.2 Arena de Batallas (`BattlesWip`)
Visible pero bloqueada con overlay "Próximamente". Conceptos planificados:
- Partida Rápida (emparejamiento aleatorio por nivel).
- Ligas Competitivas (ranking + temporadas).

**Pendiente:** prácticamente todo el sistema de combate (mecánica, turnos, cálculo de daño, rangos, recompensas).

### 7.3 Stats de Pokémon
Los `stats` se generan (0-31 por stat) pero no se usan en ningún cálculo. No hay visualización de stats en UI todavía.

### 7.4 Checkout — Consolidación de envíos
El plan está diseñado (`/plans/`) y la lógica de admin ya existe. Pendiente:
- `GET /api/checkout/eligible-orders`
- `POST /api/checkout/consolidate-estimate`
- Rama consolidación en `POST /api/checkout/stripe`
- Metadata `consolidateOrderId` en webhook de Stripe
- UI en el paso 2 del checkout
- Vista en perfil del cliente (pedido detalle)

### 7.5 Incubadoras adicionales
El schema tiene `type: IncubatorType` y `usesLeft` pero solo existe `INFINITE`. Falta:
- Tipo `LIMITED` (N usos, conseguible en tienda de objetos).
- Incubadora de múltiples slots simultáneos (conseguible con "Mejora de Incubadora").

### 7.6 Rareza y probabilidades en Pokémon
Actualmente el Pokémon eclosionado es completamente aleatorio (1-151). No hay sistema de rareza por Pokémon ni probabilidades diferenciadas según la rareza del huevo.

### 7.7 Nivel y progresión de Pokémon
No existe un sistema de niveles. Los stats son valores estáticos post-eclosión.

---

## 8. PENDIENTE PARA LA VERSIÓN ALPHA

Para tener una alpha jugable y coherente, en orden de prioridad:

### P0 — Crítico para el loop de gamificación

1. **Tienda de Objetos funcional**
   - Implementar lógica de compra de "Huevo Misterioso" (3.000 PKM → PokemonEgg con rareza aleatoria ponderada).
   - Implementar "Ticket de Expansión de Caja" (5.000 PKM → desbloquea +8 cajas manualmente sin esperar al trigger automático).
   - No hace falta "Mejora de Incubadora" para alpha.

2. **Probabilidades por rareza de huevo**
   - Definir tabla de probabilidad de Pokémon según rareza del huevo. Ejemplo:
     - COMMON: solo Pokémon #1-50 (comunes).
     - RARE: acceso a Pokémon iniciales y evoluciones.
     - LEGENDARY/MYTHIC: posibilidad de Pokémon pseudo-legendarios (Dragonite, Alakazam, etc.).
   - No es necesario implementar rareza por Pokémon individualmente — basta con rangos de Pokédex ponderados.

3. **Visualización de stats en UI**
   - Mostrar HP, ATK, DEF con barras visuales en el modal del Pokémon.
   - Ya se generan al eclosionar, solo falta pintarlos.

4. **Checkout consolidación** (ver plan en `/plans/`)
   - Necesario para el flujo de negocio completo, aunque no bloquea la gamificación.

### P1 — Mejora de la experiencia

5. **Historial de Pokémon obtenidos**
   - Pantalla "Pokédex personal": qué números tiene el usuario, cuántos faltan del 1-151, % completado.
   - Fomenta la colección y el reengagement.

6. **Múltiples huevos en inventario con UI mejorada**
   - Actualmente la UI de `IncubatorSection` es funcional pero básica. Para alpha se puede mejorar el grid de huevos en inventario.

7. **Notificación push / email cuando el huevo eclosiona**
   - Actualmente el usuario tiene que entrar manualmente. Un email o notificación in-app aumentaría el engagement.

8. **Descripción de recompensas por rareza en la página de canje**
   - El usuario que canjea un código RARE no sabe qué ventaja le da. Mostrar el tiempo de incubación y la "rareza del Pokémon" esperada.

### P2 — Monetización y retención adicional

9. **Pokémonedas por pedido completado**
   - Además del cashback VIP en allowance, dar X Pokémonedas por cada pedido entregado (tipo puntos de fidelidad).
   - Ejemplo: 500 PKM por pedido, 1.000 PKM si es el primer pedido del mes.

10. **Huevo de regalo al suscribirse a PRO**
    - Al activar plan PRO por primera vez, dar automáticamente 1 huevo de rareza UNCOMMON o RARE.
    - Incentivo directo para la conversión.

11. **Códigos con caducidad**
    - Añadir `expiresAt` a `PromoCode` para campañas temporales.

### P3 — Futuro post-alpha

12. **Arena de Batallas** — sistema completo de combate por turnos.
13. **Pokémon con rareza individual** — algunos Pokémon son más raros que otros dentro del mismo huevo.
14. **Trading** — intercambio de Pokémon entre usuarios.
15. **Temporadas** — reset parcial de ranking de batallas cada N meses con recompensas por posición.

---

## 9. ARQUITECTURA TÉCNICA

### Stack
- **Next.js App Router** — Server Components + `"use client"` donde hay interactividad.
- **Prisma v6.0.1** sobre PostgreSQL (Neon.tech). **No actualizar a v7.**
- **NextAuth** — autenticación con email/contraseña + OAuth Google.
- **Stripe** — suscripciones bimestrales + pagos únicos + webhooks.
- **Resend** — emails transaccionales.
- **Zustand** — estado del carrito (persistido en localStorage).
- **Sonner** — toasts.

### Convenciones clave
- `Product.title` (no `name`) — campo canónico del producto.
- Sin PayPal en nuevas funcionalidades (legacy en schema pero deprecado en UI).
- TypeScript estricto — sin `any`.
- Iconos: Lucide React (no emojis en UI).
- Variables de entorno: todas en `.env.local`, el código asume que están presentes.
- `requireAdmin()` / `requireAuth()` en todas las rutas de API protegidas.
- `isErrorResponse()` para validar respuestas de API antes de usarlas.
- `router.refresh()` en componentes cliente tras mutaciones server-side.

### Flujo de datos de gamificación
```
Server Action (lib/gamification.ts)
  → Prisma (PostgreSQL)
  ← Datos al Server Component
  → Props al Client Component
  → Client Component llama Server Action en interacciones
  → router.refresh() para re-fetchear desde el server
```

### Seguridad
- Todas las Server Actions y rutas API verifican `session.user.id` contra el recurso solicitado.
- Los webhooks de Stripe se verifican con `stripe.webhooks.constructEvent()`.
- El stock se decrementa solo en el webhook (no en la creación de la sesión).
- `reservedStock` evita overselling durante checkouts concurrentes.

---

## 10. FLUJOS END-TO-END RESUMIDOS

### Compra estándar
```
Catálogo → Producto → Añadir al carrito (product-actions.tsx, con weight correcto)
→ Checkout paso 1 (dirección) → paso 2 (tarifa de envío) → paso 3 (pago Stripe)
→ Webhook: Order creada, stock decrementado, allowance consumido si PRO
→ Admin: cambia estado PROCESSING → SHIPPED (añade tracking)
→ Cliente ve tracking en /profile/orders/[id]
```

### Obtener y eclosionar un Pokémon
```
Recibe código (evento, redes, pedido especial)
→ /promotion → canje → PokemonEgg en inventario
→ /profile/inventory → click "Incubar"
→ Timer en tiempo real → click "Eclosionar"
→ PokemonInstance aparece en caja
→ Si todas las cajas tienen ≥1 Pokémon → desbloqueo +8 cajas automático
```

### Suscripción PRO
```
/pricing → elige tier → Stripe Checkout (modo subscription)
→ Webhook: isPro=true, allowance recargado
→ Cada 2 meses: Stripe cobra → invoice.paid → allowance recargado (+bonus%)
→ Usuario usa allowance para precios PRO, Pokémonedas, cashback VIP
```
