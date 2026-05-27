import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso Legal — DECKLAB",
  description: "Aviso legal e información del responsable de DECKLAB.",
};

export default function AvisoLegalPage() {
  return (
    <article className="prose-legal">
      <h1>Aviso Legal</h1>
      <p className="lead">Última actualización: junio de 2026</p>

      <h2>1. Datos del responsable</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad
        de la Información y de Comercio Electrónico (LSSICE), se informa de los datos del
        responsable del sitio web:
      </p>
      <ul>
        <li><strong>Denominación:</strong> DECKLAB</li>
        <li><strong>Actividad:</strong> Tienda privada de productos Pokémon TCG personalizado</li>
        <li><strong>Domicilio:</strong> España</li>
        <li><strong>Contacto:</strong> A través del grupo privado de Telegram</li>
      </ul>

      <h2>2. Objeto y ámbito de aplicación</h2>
      <p>
        DECKLAB es una tienda de acceso privado exclusivo para miembros verificados del
        grupo de Telegram asociado. El acceso requiere verificación previa de membresía.
        Cualquier uso del sitio implica la aceptación íntegra de los presentes términos.
      </p>

      <h2>3. Propiedad intelectual</h2>
      <p>
        Los contenidos del sitio (textos, imágenes, diseño gráfico, código) son propiedad
        de DECKLAB o de sus proveedores de contenido, y están protegidos por las leyes
        vigentes de propiedad intelectual. Queda prohibida su reproducción, distribución
        o comunicación pública sin autorización expresa.
      </p>
      <p>
        Las imágenes de cartas Pokémon utilizadas con fines identificativos pertenecen a
        sus respectivos titulares. Ver la sección de <Link href="/legal/descargo">descargo de responsabilidad</Link>.
      </p>

      <h2>4. Limitación de responsabilidad</h2>
      <p>
        DECKLAB no se responsabiliza de los daños que pudieran derivarse del uso del
        sitio web, de interrupciones del servicio o de errores en los contenidos, sin
        perjuicio de las responsabilidades que la ley no permita excluir.
      </p>

      <h2>5. Legislación aplicable y jurisdicción</h2>
      <p>
        Las presentes condiciones se rigen por la legislación española. Para la resolución
        de disputas, las partes se someten a los juzgados y tribunales del domicilio del
        consumidor, de conformidad con la normativa de consumidores y usuarios.
      </p>

      <nav className="legal-nav">
        <Link href="/legal/privacidad">Política de Privacidad</Link>
        <Link href="/legal/envios">Política de Envíos</Link>
        <Link href="/legal/reembolsos">Política de Reembolsos</Link>
        <Link href="/legal/descargo">Descargo de Responsabilidad</Link>
      </nav>
    </article>
  );
}
