import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Descargo de Responsabilidad — DECKLAB",
  description: "DECKLAB no está afiliado ni asociado con The Pokémon Company, Nintendo o Game Freak.",
};

export default function DescargoDePage() {
  return (
    <article className="cursor-pointer prose-legal">
      <h1>Descargo de Responsabilidad</h1>
      <p className="lead">Última actualización: junio de 2026</p>

      <div className="notice notice-info">
        DECKLAB es un proyecto independiente de aficionados al Juego de Cartas
        Coleccionables Pokémon. No somos una empresa oficial ni estamos autorizados,
        respaldados ni afiliados de ninguna forma con The Pokémon Company, Nintendo
        Co., Ltd. ni Game Freak.
      </div>

      <h2>1. Propiedad intelectual de terceros</h2>
      <p>
        Pokémon y todos los nombres, personajes, marcas comerciales y elementos
        visuales asociados son propiedad exclusiva de{" "}
        <strong>The Pokémon Company International, Inc.</strong>, Nintendo Co., Ltd.
        y/o Game Freak, Inc.
      </p>
      <p>
        Las referencias a cartas, expansiones, ilustraciones y demás elementos del
        Juego de Cartas Coleccionables Pokémon se realizan con fines meramente
        identificativos, dentro del ámbito de la colección y la reventa de productos
        originales adquiridos lícitamente.
      </p>
      <p>
        DECKLAB no fabrica, reproduce ni altera cartas ni ningún otro material
        con derechos de autor. Todos los productos comercializados son
        <strong> productos originales y oficiales</strong> de The Pokémon Company.
      </p>

      <h2>2. Uso de imágenes</h2>
      <p>
        Las imágenes de cartas o productos que puedan aparecer en el sitio web se
        utilizan con fines informativos e identificativos. Si eres titular de algún
        derecho sobre dichas imágenes y consideras que su uso no es adecuado, contáctanos
        a través del grupo de Telegram y retiraremos el contenido en el menor tiempo
        posible.
      </p>

      <h2>3. Aleatoriedad de los productos</h2>
      <p>
        Los productos de cartas coleccionables tienen un <strong>componente aleatorio
        inherente</strong>. Las probabilidades publicadas en cada ficha de producto son
        orientativas y se basan en los datos oficiales de The Pokémon Company o en
        estadísticas propias derivadas de aperturas reales. DECKLAB no garantiza la
        obtención de cartas específicas.
      </p>
      <p>
        La adquisición de productos aleatorios implica la aceptación de este riesgo
        por parte del comprador. Recomendamos leer la política de{" "}
        <Link href="/legal/reembolsos" className="cursor-pointer">reembolsos</Link> antes de comprar.
      </p>

      <h2>4. Precios y mercado secundario</h2>
      <p>
        Los precios de DECKLAB pueden diferir del precio de venta al público oficial
        (PVP) de The Pokémon Company. Los productos pueden tener un coste superior o
        inferior al PVP en función de disponibilidad, exclusividad o condición del
        artículo. DECKLAB opera en el mercado secundario de coleccionismo.
      </p>

      <h2>5. Contacto para retirada de contenidos</h2>
      <p>
        Si representas a The Pokémon Company, Nintendo, Game Freak o cualquier otro
        titular de derechos y tienes alguna reclamación, contáctanos a través del
        grupo de Telegram. Atenderemos tu solicitud de buena fe y con la mayor
        diligencia posible.
      </p>

      <nav className="legal-nav">
        <Link href="/legal/aviso-legal" className="cursor-pointer">Aviso Legal</Link>
        <Link href="/legal/privacidad" className="cursor-pointer">Política de Privacidad</Link>
        <Link href="/legal/envios" className="cursor-pointer">Política de Envíos</Link>
        <Link href="/legal/reembolsos" className="cursor-pointer">Política de Reembolsos</Link>
      </nav>
    </article>
  );
}
