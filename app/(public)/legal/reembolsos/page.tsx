import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Reembolsos — DECKLAB",
  description: "DECKLAB no acepta devoluciones. Conoce las razones y excepciones.",
};

export default function ReembolsosPage() {
  return (
    <article className="cursor-pointer prose-legal">
      <h1>Política de Reembolsos y Devoluciones</h1>
      <p className="lead">Última actualización: junio de 2026</p>

      <div className="notice notice-warning">
        <strong>DECKLAB no acepta devoluciones ni emite reembolsos</strong> salvo en los
        casos expresamente contemplados en esta política y en la legislación vigente.
        Al completar una compra, el usuario acepta estas condiciones de forma explícita.
      </div>

      <h2>1. Naturaleza de los productos</h2>
      <p>
        Los productos comercializados en DECKLAB son <strong>artículos coleccionables
        de naturaleza aleatoria</strong> (sobres, decks y productos precintados de
        Pokémon TCG). Una vez abiertos, su contenido es irreversible. Adicionalmente,
        muchos productos son de edición limitada o producción personalizada.
      </p>
      <p>
        Por estas razones, y de conformidad con el artículo 103 del Real Decreto
        Legislativo 1/2007 (TRLGDCU), quedan excluidos del derecho de desistimiento:
      </p>
      <ul>
        <li>
          Bienes precintados que no sean aptos para ser devueltos por razones de
          protección de la salud o de higiene, y que hayan sido desprecintados tras la
          entrega.
        </li>
        <li>
          Bienes confeccionados conforme a las especificaciones del consumidor o
          claramente personalizados.
        </li>
      </ul>

      <h2>2. No hay derecho de desistimiento</h2>
      <p>
        Dado que los productos de DECKLAB están dentro de las exclusiones legales citadas,
        <strong> no existe periodo de desistimiento de 14 días</strong> reconocido por la
        normativa de consumidores, más allá de los casos de producto defectuoso o error
        del vendedor.
      </p>

      <h2>3. Excepciones: cuándo sí procede un reembolso</h2>
      <p>DECKLAB gestionará un reembolso o reenvío en los siguientes casos:</p>
      <ol>
        <li>
          <strong>Producto recibido dañado o defectuoso</strong> por causa imputable al
          transporte o al embalaje. El usuario debe notificarlo dentro de las{" "}
          <strong>48 horas</strong> siguientes a la recepción, aportando fotografías del
          estado del paquete y el producto.
        </li>
        <li>
          <strong>Error en el pedido</strong> por parte de DECKLAB (artículo incorrecto
          enviado). El usuario notificará el error antes de abrir el embalaje del
          producto; DECKLAB asumirá los gastos de devolución y reenvío.
        </li>
        <li>
          <strong>Pedido no entregado</strong> tras 30 días naturales desde la fecha de
          envío (con seguimiento) o 60 días (sin seguimiento), siempre que no sea
          imputable al domicilio erróneo facilitado por el usuario.
        </li>
      </ol>
      <p>
        En ningún caso se reembolsa el coste de envío si el producto fue efectivamente
        entregado.
      </p>

      <h2>4. Suscripciones PRO</h2>
      <p>
        Las suscripciones PRO tienen un <strong>periodo mínimo de permanencia de
        2 meses naturales</strong> desde la contratación. No se aceptan cancelaciones
        ni reembolsos dentro de dicho periodo.
      </p>
      <p>
        Transcurrido el periodo mínimo, el usuario puede cancelar la suscripción en
        cualquier momento desde su perfil. El acceso PRO permanece activo hasta el
        final del ciclo bimestral ya pagado. No se reembolsa el saldo de allowance
        acumulado y no utilizado.
      </p>

      <h2>5. Cómo reclamar</h2>
      <p>
        Contacta con DECKLAB a través del grupo privado de Telegram aportando:
      </p>
      <ul>
        <li>Número de pedido</li>
        <li>Descripción detallada del problema</li>
        <li>Fotografías del estado del producto y embalaje (si aplica)</li>
      </ul>
      <p>
        Responderemos en un plazo máximo de 5 días hábiles. En caso de no alcanzar un
        acuerdo, el consumidor puede acudir a la plataforma europea de resolución de
        litigios en línea:{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
         className="cursor-pointer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      <nav className="legal-nav">
        <Link href="/legal/aviso-legal" className="cursor-pointer">Aviso Legal</Link>
        <Link href="/legal/privacidad" className="cursor-pointer">Política de Privacidad</Link>
        <Link href="/legal/envios" className="cursor-pointer">Política de Envíos</Link>
        <Link href="/legal/descargo" className="cursor-pointer">Descargo de Responsabilidad</Link>
      </nav>
    </article>
  );
}
