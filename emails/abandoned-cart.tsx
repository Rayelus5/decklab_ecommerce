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

interface CartItem {
  title: string;
  variantTitle?: string | null;
  quantity: number;
  price: number;
}

interface AbandonedCartEmailProps {
  customerName: string;
  items: CartItem[];
  subtotal: number;
  appUrl?: string;
}

export function AbandonedCartEmail({
  customerName,
  items,
  subtotal,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: AbandonedCartEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>¿Olvidaste algo? Tu carrito de DECKLAB te espera</Preview>
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
              ¿Olvidaste algo?
            </Heading>
            <Text style={styles.heroText}>
              Hola {customerName}, dejaste algunos artículos en tu carrito. Vuelve a la tienda cuando quieras para completar tu compra.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Items */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>
              Artículos en tu carrito
            </Heading>

            {items.map((item, i) => (
              <Section key={i} style={styles.itemRow}>
                <Section style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    {item.title}
                    {item.variantTitle ? ` — ${item.variantTitle}` : ""}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Cantidad: {item.quantity}
                  </Text>
                </Section>
                <Text style={styles.itemPrice}>
                  {(item.price * item.quantity).toFixed(2).replace(".", ",")} €
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={styles.divider} />

          {/* Subtotal */}
          <Section style={styles.section}>
            <Section style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal de productos</Text>
              <Text style={styles.totalValue}>{subtotal.toFixed(2).replace(".", ",")} €</Text>
            </Section>
            <Text style={styles.subtotalNote}>
              El coste de envío se calcula al completar el pedido.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Link href={`${appUrl}/products`} style={styles.ctaButton}>
              Volver a la tienda
            </Link>
          </Section>

          {/* Disclaimer */}
          <Section style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              El stock es limitado. No garantizamos la disponibilidad de los artículos hasta completar el pago.
            </Text>
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
    margin: "0",
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
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: "#e6e6e6",
    fontSize: "14px",
    fontWeight: 600,
    margin: "0 0 2px",
  },
  itemMeta: {
    color: "#6a6b6c",
    fontSize: "12px",
    margin: 0,
  },
  itemPrice: {
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    margin: 0,
    textAlign: "right",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  totalLabel: {
    color: "#9c9c9d",
    fontSize: "13px",
    margin: 0,
  },
  totalValue: {
    color: "#e6e6e6",
    fontSize: "13px",
    fontWeight: 600,
    margin: 0,
  },
  subtotalNote: {
    color: "#454647",
    fontSize: "11px",
    margin: "8px 0 0",
    lineHeight: "1.5",
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
  disclaimer: {
    padding: "0 32px 24px",
  },
  disclaimerText: {
    color: "#454647",
    fontSize: "11px",
    lineHeight: "1.5",
    margin: 0,
    textAlign: "center",
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

export default AbandonedCartEmail;
