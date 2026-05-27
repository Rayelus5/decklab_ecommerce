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

interface OrderItem {
  title: string;
  variantTitle?: string | null;
  quantity: number;
  price: number;
  wasProPrice: boolean;
}

interface DeliveryAddress {
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderConfirmationProps {
  orderNumber: number;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  couponCode?: string | null;
  total: number;
  shippingMethod: string;
  address: DeliveryAddress;
  paymentMethod: string;
  appUrl?: string;
}

export function OrderConfirmation({
  orderNumber,
  customerName,
  items,
  subtotal,
  shippingCost,
  discountAmount,
  couponCode,
  total,
  shippingMethod,
  address,
  paymentMethod,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: OrderConfirmationProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{`Tu pedido #${orderNumber} ha sido confirmado — DECKLAB SHOP`}</Preview>
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
              Pedido confirmado
            </Heading>
            <Text style={styles.heroText}>
              Hola {customerName}, hemos recibido tu pedido correctamente.
            </Text>
            <Text style={styles.orderNumber}>#{orderNumber}</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Items */}
          <Section style={styles.section}>
            <Heading as="h3" style={styles.sectionTitle}>
              Resumen del pedido
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
                    {item.wasProPrice ? "  ·  Precio PRO aplicado" : ""}
                  </Text>
                </Section>
                <Text style={styles.itemPrice}>
                  {(item.price * item.quantity).toFixed(2).replace(".", ",")} €
                </Text>
              </Section>
            ))}
          </Section>

          <Hr style={styles.divider} />

          {/* Totales */}
          <Section style={styles.section}>
            <Section style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{subtotal.toFixed(2).replace(".", ",")} €</Text>
            </Section>

            {discountAmount != null && discountAmount > 0 && (
              <Section style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Descuento{couponCode ? ` (${couponCode})` : ""}
                </Text>
                <Text style={{ ...styles.totalValue, color: "#59d499" }}>
                  -{discountAmount.toFixed(2).replace(".", ",")} €
                </Text>
              </Section>
            )}

            <Section style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Envío ({shippingMethod})
              </Text>
              <Text style={styles.totalValue}>
                {shippingCost === 0 ? "GRATIS" : `${shippingCost.toFixed(2).replace(".", ",")} €`}
              </Text>
            </Section>

            <Hr style={{ ...styles.divider, margin: "8px 0" }} />

            <Section style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {total.toFixed(2).replace(".", ",")} €
              </Text>
            </Section>
          </Section>

          <Hr style={styles.divider} />

          {/* Dirección y pago */}
          <Section style={styles.grid}>
            <Section style={styles.gridCol}>
              <Heading as="h4" style={styles.colTitle}>Dirección de entrega</Heading>
              <Text style={styles.colText}>{address.line1}</Text>
              {address.line2 && <Text style={styles.colText}>{address.line2}</Text>}
              <Text style={styles.colText}>
                {address.postalCode} {address.city}
              </Text>
              <Text style={styles.colText}>{address.country}</Text>
            </Section>

            <Section style={styles.gridCol}>
              <Heading as="h4" style={styles.colTitle}>Pago</Heading>
              <Text style={styles.colText}>{paymentMethod}</Text>
              <Text style={{ ...styles.colText, marginTop: "12px" }}>
                Método de envío
              </Text>
              <Text style={styles.colText}>{shippingMethod}</Text>
            </Section>
          </Section>

          <Hr style={styles.divider} />

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Link href={`${appUrl}/profile/orders`} style={styles.ctaButton}>
              Ver mis pedidos
            </Link>
          </Section>

          {/* Disclaimer */}
          <Section style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Todos los productos se venden sin posibilidad de devolución ni cambio.
              Al completar la compra aceptas esta política.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              DECKLAB SHOP · Pokémon TCG Personalizado
            </Text>
            <Text style={styles.footerText}>
              <Link href={`${appUrl}`} style={styles.footerLink}>
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
    margin: "0 0 16px",
    lineHeight: "1.5",
  },
  orderNumber: {
    color: "#59d499",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    margin: 0,
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
  grandTotalLabel: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    margin: 0,
  },
  grandTotalValue: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 900,
    margin: 0,
  },
  grid: {
    padding: "24px 32px",
    display: "flex",
    gap: "24px",
  },
  gridCol: {
    flex: 1,
  },
  colTitle: {
    color: "#e6e6e6",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 8px",
  },
  colText: {
    color: "#9c9c9d",
    fontSize: "13px",
    margin: "0 0 2px",
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

export default OrderConfirmation;
