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

interface OrderCancellationProps {
  orderNumber: number;
  customerName: string;
  total: number;
  isRefund?: boolean;
  appUrl?: string;
}

export function OrderCancellation({
  orderNumber,
  customerName,
  total,
  isRefund = false,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: OrderCancellationProps) {
  const title = isRefund ? "Pedido reembolsado" : "Pedido cancelado";
  const preview = isRefund
    ? `Tu pedido #${orderNumber} ha sido reembolsado — DECKLAB SHOP`
    : `Tu pedido #${orderNumber} ha sido cancelado — DECKLAB SHOP`;
  const bodyText = isRefund
    ? `Hola ${customerName}, tu pedido ha sido reembolsado por el equipo de DECKLAB. El importe de ${total.toFixed(2).replace(".", ",")} € será devuelto a tu método de pago original en un plazo de 5–10 días hábiles.`
    : `Hola ${customerName}, tu pedido ha sido cancelado correctamente. Si realizaste el pago, el importe de ${total.toFixed(2).replace(".", ",")} € será devuelto a tu método de pago original en un plazo de 5–10 días hábiles.`;

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
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
              {title}
            </Heading>
            <Text style={styles.orderNumber}>#{orderNumber}</Text>
            <Text style={styles.heroText}>{bodyText}</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Info */}
          <Section style={styles.section}>
            <Text style={styles.infoText}>
              Si tienes alguna duda sobre el estado de tu reembolso, no dudes en contactarnos a través de nuestros canales de soporte.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Link href={`${appUrl}/profile/orders`} style={styles.ctaButton}>
              Ver mis pedidos
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
  orderNumber: {
    color: "#ef4444",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    margin: "0 0 16px",
  },
  heroText: {
    color: "#9c9c9d",
    fontSize: "15px",
    margin: 0,
    lineHeight: "1.6",
  },
  divider: {
    borderColor: "#1b1c1e",
    borderTopWidth: "1px",
    margin: "0",
  },
  section: {
    padding: "24px 32px",
  },
  infoText: {
    color: "#6a6b6c",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: 0,
    textAlign: "center",
  },
  ctaSection: {
    padding: "24px 32px",
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#ffffff",
    color: "#111214",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.04em",
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

export default OrderCancellation;
