### 🎯 El Objetivo Principal

Estamos construyendo **DECKLAB SHOP**, un e-commerce premium enfocado en Cardistry y Magia.

**Nuestra funcionalidad estrella ("Killer Feature")** es el sistema de **Suscripciones PRO por Tiers**:
Los usuarios pagan una mensualidad (Nivel 1 al 5) que no les da saldo gratis, sino que les otorga una **"Capacidad de Compra Mensual"**. Esto les permite acceder a los productos a un "Precio PRO" (muy rebajado) hasta agotar su límite mensual. Si se pasan del límite, pagan el precio normal.

---

### ✅ Lo que ya hemos construido (Y está funcionando)

Básicamente, **hemos completado el 100% de la experiencia del cliente (Frontend + Backend de usuario)**.

1. **Infraestructura y Datos:**
* App Next.js 16 configurada con Tailwind (diseño oscuro "Apple-like").
* Base de datos PostgreSQL (Neon) conectada mediante Prisma v6 con un esquema complejo y robusto.


2. **Autenticación y Seguridad:**
* Registro y Login completo usando NextAuth v5 (encriptación bcrypt).


3. **Tienda y Catálogo:**
* Página de Inicio (`/`) con productos destacados y diseño atractivo.
* Catálogo (`/products`) y fichas de producto detalladas con selector de cantidad.
* Carrito reactivo ultra-rápido manejado con Zustand.


4. **Checkout y Pagos Reales:**
* Cálculo de envíos dinámicos basados en el **peso** de los productos y la **región** (España/Europa).
* Integración con **Stripe Checkout** para pagos.
* **Webhooks de Stripe** configurados: cuando alguien paga, el servidor automáticamente crea el pedido, resta el stock y descuenta el Saldo PRO del usuario.


5. **Suscripciones (Pricing):**
* Página `/pricing` donde los usuarios pueden comprar sus niveles PRO vía Stripe Subscriptions.


6. **Centro de Mando del Usuario (`/profile`):**
* Dashboard con barra de progreso visual que muestra cuánto saldo PRO le queda al usuario.
* Historial de pedidos.
* **(Aquí nos quedamos):** Implementamos los ajustes de cuenta (cambiar nombre, contraseña, gestionar múltiples direcciones de envío) y, por último, la **Eliminación segura de la cuenta**, que cancela sus suscripciones en Stripe y borra su rastro en la base de datos.



---

### 📍 Dónde nos quedamos exactamente

Justo en nuestro último paso, resolvimos un pequeño error de Prisma al intentar ordenar las direcciones de envío (`Address`) porque nos faltaba el campo `createdAt` en la base de datos. Lo solucionamos actualizando el esquema y migrando.

Con eso, cerramos por completo todo el ciclo de vida de un cliente en la web.

---

### 🚀 Próximos Pasos (Lo que nos falta)

Ahora que los clientes pueden comprar, necesitamos que los administradores (tú) puedan gestionar la tienda. Tenemos tres grandes frentes abiertos:

1. **El Panel de Administración (`/admin`):**
* Necesitamos un dashboard oculto y protegido donde puedas ver los pedidos, cambiar su estado (ej. "Enviado"), añadir los números de seguimiento de Correos, y hacer CRUD (Crear, Leer, Actualizar, Borrar) de productos y stock sin tocar la base de datos a mano.


2. **Sistema de Emails Transaccionales:**
* Integrar `Resend` + `React Email` para que cuando un webhook de Stripe confirme un pago, se envíe un PDF con la factura y un recibo bonito al correo del cliente.


3. **Despliegue a Producción (Deploy):**
* Subir la web a Vercel, configurar los dominios y pasar las claves de Stripe de "Test" a "Live".



¿Por cuál de estos tres frentes te gustaría que empezáramos hoy?