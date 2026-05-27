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

interface SubscriptionRenewalProps {
  customerName: string;
  tierName: string;
  newBalance: number;
  priceCharged: number;
  nextRenewalDate: string;
  appUrl?: string;
}

export function SubscriptionRenewal({
  customerName,
  tierName,
  newBalance,
  priceCharged,
  nextRenewalDate,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: SubscriptionRenewalProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Tu suscripción PRO {tierName} se ha renovado — DECKLAB SHOP</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>DECKLAB</Heading>
            <Text style={styles.headerSub}>SHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={styles.hero}>
            <Text style={styles.proBadge}>PRO</Text>
            <Heading as="h2" style={styles.heroTitle}>
              Suscripción renovada
            </Heading>
            <Text style={styles.heroText}>
              Hola {customerName}, tu plan{" "}
              <strong style={{ color: "#fbbf24" }}>{tierName}</strong> se ha renovado
              correctamente.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Stats */}
          <Section style={styles.statsSection}>
            <Section style={styles.statCard}>
              <Text style={styles.statLabel}>Allowance disponible</Text>
              <Text style={styles.statValue}>{newBalance.toFixed(2).replace(".", ",")} €</Text>
            </Section>

            <Section style={styles.statCard}>
              <Text style={styles.statLabel}>Importe cobrado</Text>
              <Text style={styles.statValue}>{priceCharged.toFixed(2).replace(".", ",")} €</Text>
            </Section>

            <Section style={styles.statCard}>
              <Text style={styles.statLabel}>Próxima renovación</Text>
              <Text style={styles.statValue}>{nextRenewalDate}</Text>
            </Section>
          </Section>

          <Hr style={styles.divider} />

          {/* Info allowance */}
          <Section style={styles.section}>
            <Text style={styles.infoText}>
              Tu allowance mensual PRO ya está disponible y listo para usar en tu próxima compra.
              Recuerda que el allowance se aplica automáticamente a los productos con precio PRO,
              y no caduca hasta la próxima renovación.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Link href={`${appUrl}/products`} style={styles.ctaButton}>
              Ir a la tienda
            </Link>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Puedes gestionar o cancelar tu suscripción desde{" "}
              <Link href={`${appUrl}/profile/settings`} style={styles.footerLink}>
                tu perfil
              </Link>
              .
            </Text>
            <Text style={styles.footerText}>
              DECKLAB SHOP · Pokémon TCG Personalizado
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
  proBadge: {
    display: "inline-block",
    backgroundColor: "#451a03",
    border: "1px solid #b45309",
    borderRadius: "100px",
    color: "#fbbf24",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.16em",
    padding: "4px 12px",
    margin: "0 0 16px",
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
  statsSection: {
    padding: "24px 32px",
    display: "flex",
    gap: "12px",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#07080a",
    border: "1px solid #1b1c1e",
    borderRadius: "10px",
    padding: "16px",
    textAlign: "center",
  },
  statLabel: {
    color: "#6a6b6c",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 6px",
  },
  statValue: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  section: {
    padding: "24px 32px",
  },
  infoText: {
    color: "#9c9c9d",
    fontSize: "13px",
    lineHeight: "1.6",
    margin: 0,
    textAlign: "center",
  },
  ctaSection: {
    padding: "8px 32px 32px",
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#fbbf24",
    color: "#040506",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-block",
    letterSpacing: "0.04em",
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
    margin: "4px 0",
    lineHeight: "1.5",
  },
  footerLink: {
    color: "#6a6b6c",
    textDecoration: "underline",
  },
};

export default SubscriptionRenewal;
