import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — DECKLAB",
  description: "Cómo DECKLAB trata y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <article className="prose-legal">
      <h1>Política de Privacidad</h1>
      <p className="lead">Última actualización: junio de 2026</p>

      <p>
        DECKLAB trata tus datos personales conforme al Reglamento (UE) 2016/679
        (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de
        los derechos digitales (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>DECKLAB — contacto a través del grupo privado de Telegram.</p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>
          <strong>Datos de registro:</strong> nombre, dirección de email, contraseña
          hasheada (nunca en claro).
        </li>
        <li>
          <strong>Datos de Telegram:</strong> ID de usuario, nombre de usuario y foto de
          perfil, exclusivamente para verificar la membresía en el grupo privado.
        </li>
        <li>
          <strong>Datos de pedido:</strong> dirección de envío, artículos comprados,
          importe pagado y método de pago (procesado por Stripe; no almacenamos datos de
          tarjeta).
        </li>
        <li>
          <strong>Datos técnicos:</strong> dirección IP (de forma anonimizada), cookies
          de sesión estrictamente necesarias.
        </li>
      </ul>

      <h2>3. Finalidades y base jurídica</h2>
      <ul>
        <li>
          <strong>Gestión de la cuenta y acceso:</strong> ejecución del contrato
          (Art. 6.1.b RGPD).
        </li>
        <li>
          <strong>Procesamiento de pedidos y envíos:</strong> ejecución del contrato
          (Art. 6.1.b RGPD).
        </li>
        <li>
          <strong>Verificación de membresía en Telegram:</strong> interés legítimo en
          mantener el carácter privado de la tienda (Art. 6.1.f RGPD).
        </li>
        <li>
          <strong>Comunicaciones sobre pedidos (email y Telegram):</strong> ejecución del
          contrato (Art. 6.1.b RGPD).
        </li>
        <li>
          <strong>Cumplimiento de obligaciones legales:</strong> facturación y registros
          contables (Art. 6.1.c RGPD).
        </li>
      </ul>

      <h2>4. Destinatarios de los datos</h2>
      <p>Tus datos pueden compartirse con los siguientes proveedores de servicio, en
        calidad de encargados del tratamiento:</p>
      <ul>
        <li><strong>Stripe:</strong> procesamiento de pagos (EE.UU., con cláusulas contractuales tipo UE).</li>
        <li><strong>Resend:</strong> envío de emails transaccionales.</li>
        <li><strong>Vercel:</strong> alojamiento del sitio web.</li>
        <li><strong>Neon:</strong> base de datos PostgreSQL.</li>
        <li><strong>Telegram:</strong> verificación de membresía y notificaciones.</li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>

      <h2>5. Conservación</h2>
      <p>
        Los datos de pedidos se conservan durante el plazo legalmente exigible para
        obligaciones fiscales (generalmente 5 años). Los datos de cuenta se eliminan en
        el plazo de 30 días tras la solicitud de baja, salvo que existan obligaciones
        legales que impidan su eliminación inmediata.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento tus derechos de acceso, rectificación,
        supresión, oposición, limitación y portabilidad contactando a través del grupo
        de Telegram. También puedes reclamar ante la Agencia Española de Protección de
        Datos (aepd.es).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Utilizamos exclusivamente cookies técnicas estrictamente necesarias para el
        funcionamiento de la sesión. No empleamos cookies de seguimiento, publicidad ni
        análisis de terceros sin consentimiento previo.
      </p>

      <nav className="legal-nav">
        <Link href="/legal/aviso-legal">Aviso Legal</Link>
        <Link href="/legal/envios">Política de Envíos</Link>
        <Link href="/legal/reembolsos">Política de Reembolsos</Link>
        <Link href="/legal/descargo">Descargo de Responsabilidad</Link>
      </nav>
    </article>
  );
}
