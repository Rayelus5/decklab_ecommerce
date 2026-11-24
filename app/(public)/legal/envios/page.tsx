import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Envíos — DECKLAB",
  description: "Tiempos, métodos y condiciones de envío de DECKLAB.",
};

export default function EnviosPage() {
  return (
    <article className="cursor-pointer prose-legal">
      <h1>Política de Envíos</h1>
      <p className="lead">Última actualización: junio de 2026</p>

      <h2>1. Cobertura geográfica</h2>
      <p>Realizamos envíos a:</p>
      <ul>
        <li><strong>España peninsular e islas</strong> (Baleares, Canarias, Ceuta y Melilla)</li>
        <li><strong>Unión Europea</strong> (selección de países; disponibilidad visible en el checkout)</li>
      </ul>
      <p>
        Los envíos a Canarias, Ceuta y Melilla pueden estar sujetos a tasas aduaneras
        adicionales responsabilidad del destinatario.
      </p>

      <h2>2. Métodos de envío</h2>
      <p>Operamos con <strong>Correos de España</strong> como operador logístico principal:</p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Modalidad</th>
              <th>Descripción</th>
              <th>Seguimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ordinario</td>
              <td>Carta ordinaria, sin seguimiento</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Certificado</td>
              <td>Envío registrado con número de seguimiento</td>
              <td>Sí</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        El precio del envío se calcula automáticamente en el checkout según el peso total
        del pedido y el destino. Los usuarios con suscripción PRO de nivel superior pueden
        tener envío gratuito según su plan.
      </p>

      <h2>3. Plazos estimados</h2>
      <ul>
        <li>
          <strong>Preparación del pedido:</strong> 1–3 días hábiles desde la confirmación
          del pago. Los pedidos se procesan de forma manual; no existe un almacén
          automatizado.
        </li>
        <li>
          <strong>España peninsular:</strong> 2–5 días hábiles (ordinario) / 1–3 días
          hábiles (certificado).
        </li>
        <li>
          <strong>Islas y territorios:</strong> 4–10 días hábiles según destino.
        </li>
        <li>
          <strong>Unión Europea:</strong> 7–21 días hábiles según país de destino.
        </li>
      </ul>
      <p>
        Los plazos son estimaciones. DECKLAB no se responsabiliza de retrasos
        imputables al operador logístico, a la aduana o a causas de fuerza mayor.
      </p>

      <h2>4. Seguimiento</h2>
      <p>
        Si elegiste envío certificado, recibirás el número de seguimiento por email y,
        si tienes Telegram vinculado, también vía mensaje privado del bot de DECKLAB,
        en cuanto el pedido sea marcado como enviado.
      </p>
      <p>
        Puedes rastrear tu envío en{" "}
        <a
          href="https://www.correos.es/es/es/herramientas/localizador/envios"
          target="_blank"
          rel="noopener noreferrer"
         className="cursor-pointer">
          correos.es
        </a>.
      </p>

      <h2>5. Incidencias</h2>
      <p>
        En caso de pérdida o daño del paquete, contáctanos a través del grupo privado
        de Telegram con el número de pedido y, si dispones de él, el número de
        seguimiento. Gestionaremos la reclamación ante Correos. Los plazos de resolución
        son los marcados por el operador postal.
      </p>
      <p>
        <strong>Importante:</strong> Los productos de DECKLAB son artículos coleccionables
        de naturaleza aleatoria. Las incidencias de transporte no generan derecho a
        reembolso del contenido. Ver{" "}
        <Link href="/legal/reembolsos" className="cursor-pointer">Política de Reembolsos</Link>.
      </p>

      <nav className="legal-nav">
        <Link href="/legal/aviso-legal" className="cursor-pointer">Aviso Legal</Link>
        <Link href="/legal/privacidad" className="cursor-pointer">Política de Privacidad</Link>
        <Link href="/legal/reembolsos" className="cursor-pointer">Política de Reembolsos</Link>
        <Link href="/legal/descargo" className="cursor-pointer">Descargo de Responsabilidad</Link>
      </nav>
    </article>
  );
}
