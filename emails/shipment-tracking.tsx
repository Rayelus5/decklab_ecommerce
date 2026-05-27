import { Html } from "@react-email/html";
import { Head } from "@react-email/head";
import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Preview } from "@react-email/preview";
import { Link } from "@react-email/link";

interface ShipmentTrackingProps {
  orderNumber: number;
  customerName: string;
  trackingNumber: string;
  carrier?: string;
  appUrl?: string;
}

const CORREOS_TRACKING_URL = "https://www.correos.es/es/es/herramientas/localizador/envios/detalle?expediciones=";

export function ShipmentTracking({
  orderNumber,
  customerName,
  trackingNumber,
  carrier = "Correos",
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: ShipmentTrackingProps) {
  const trackingUrl =
    carrier === "Correos"
      ? `${CORREOS_TRACKING_URL}${trackingNumber}`
      : `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`;

  return (
    <Html lang="es">
      <Head />
      <Preview>{`Tu pedido #${orderNumber} está de camino — DECKLAB SHOP`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>DECKLAB</Heading>
            <Text style={styles.headerSub}>SHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={styles.hero}>
            <Heading as="h2" style={styles.heroTitle}>
              Tu pedido está en camino
            </Heading>
            <Text style={styles.heroText}>
              Hola {customerName}, tu pedido #{orderNumber} ha sido enviado y ya está en ruta hacia ti.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Tracking card */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>
              Número de seguimiento
            </Heading>

            <Section style={styles.trackingCard}>
              <Text style={styles.carrierText}>{carrier}</Text>
              <Text style={styles.trackingNumber}>{trackingNumber}</Text>
              <Link href={trackingUrl} style={styles.trackingButton}>
                Rastrear envío
              </Link>
            </Section>

            <Text style={styles.helpText}>
              Haz clic en el botón de arriba para rastrear tu envío en la web de {carrier}.
              Ten en cuenta que el número puede tardar unas horas en activarse en su sistema.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* CTA pedidos */}
          <Section style={styles.ctaSection}>
            <Link href={`${appUrl}/profile/orders/${orderNumber}`} style={styles.ctaButton}>
              Ver detalles del pedido
            </Link>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              DECKLAB SHOP · Pokémon TCG Personalizado
            </Text>
            <Text style={styles.footerText}>
              <Link href={appUrl} style={styles.footerLink}>
                decklab.rayelus.com
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#07080a",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#111214",
    border: "1px solid #363739",
    borderRadius: "16px",
    maxWidth: "560px",
    margin: "0 auto",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#040506",
    padding: "28px 32px 20px",
    textAlign: "center",
    borderBottom: "1px solid #1b1c1e",
  },
  logo: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    margin: 0,
  },
  headerSub: {
    color: "#6a6b6c",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.2em",
    margin: "2px 0 0",
    textTransform: "uppercase",
  },
  hero: {
    padding: "32px 32px 24px",
    textAlign: "center",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 800,
    margin: "0 0 12px",
  },
  heroText: {
    color: "#9c9c9d",
    fontSize: "15px",
    margin: 0,
    lineHeight: "1.5",
  },
  divider: {
    borderColor: "#1b1c1e",
    borderTopWidth: "1px",
    margin: 0,
  },
  section: {
    padding: "24px 32px",
  },
  sectionTitle: {
    color: "#e6e6e6",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 16px",
  },
  trackingCard: {
    backgroundColor: "#07080a",
    border: "1px solid #1b1c1e",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    marginBottom: "16px",
  },
  carrierText: {
    color: "#6a6b6c",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: "0 0 8px",
  },
  trackingNumber: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    margin: "0 0 20px",
    fontFamily: "'Courier New', monospace",
  },
  trackingButton: {
    backgroundColor: "#59d499",
    color: "#040506",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
  },
  helpText: {
    color: "#6a6b6c",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: 0,
    textAlign: "center",
  },
  ctaSection: {
    padding: "24px 32px",
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "transparent",
    color: "#9c9c9d",
    border: "1px solid #363739",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
    display: "inline-block",
  },
  footer: {
    backgroundColor: "#07080a",
    borderTop: "1px solid #1b1c1e",
    padding: "20px 32px",
    textAlign: "center",
  },
  footerText: {
    color: "#454647",
    fontSize: "11px",
    margin: "2px 0",
    letterSpacing: "0.06em",
  },
  footerLink: {
    color: "#6a6b6c",
    textDecoration: "none",
  },
};

export default ShipmentTracking;
