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

export type EmailVariant = "announcement" | "promotion" | "news";

interface CustomEmailProps {
  customerName?: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  variant: EmailVariant;
  appUrl?: string;
}

// Colores de acento por variante
const ACCENT: Record<EmailVariant, { color: string; bg: string; border: string; badge: string }> = {
  announcement: {
    color: "#e5e5e5",
    bg: "#111214",
    border: "#363739",
    badge: "ANUNCIO",
  },
  promotion: {
    color: "#fbbf24",
    bg: "#451a03",
    border: "#b45309",
    badge: "OFERTA",
  },
  news: {
    color: "#38bdf8",
    bg: "#0c1a2e",
    border: "#0369a1",
    badge: "NOVEDAD",
  },
};

export function CustomEmail({
  customerName = "Cliente",
  heading,
  body,
  ctaText,
  ctaUrl,
  variant,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: CustomEmailProps) {
  const accent = ACCENT[variant];

  // Convertir saltos de línea en párrafos
  const paragraphs = body.split("\n").filter((p) => p.trim().length > 0);

  return (
    <Html lang="es">
      <Head />
      <Preview>{heading} — DECKLAB SHOP</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>DECKLAB</Heading>
            <Text style={styles.headerSub}>SHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={styles.hero}>
            {/* Badge de variante */}
            <Text
              style={{
                ...styles.badge,
                backgroundColor: accent.bg,
                borderColor: accent.border,
                color: accent.color,
              }}
            >
              {accent.badge}
            </Text>

            {/* Heading principal */}
            <Heading as="h2" style={styles.heroTitle}>
              {heading}
            </Heading>

            {/* Saludo */}
            <Text style={styles.greeting}>
              Hola {customerName},
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Cuerpo del mensaje */}
          <Section style={styles.bodySection}>
            {paragraphs.map((paragraph, i) => (
              <Text key={i} style={styles.bodyText}>
                {paragraph}
              </Text>
            ))}
          </Section>

          {/* CTA (opcional) */}
          {ctaText && ctaUrl && (
            <Section style={styles.ctaSection}>
              <Link
                href={ctaUrl}
                style={{
                  ...styles.ctaButton,
                  backgroundColor: accent.color,
                  color: variant === "announcement" ? "#040506" : "#040506",
                }}
              >
                {ctaText}
              </Link>
            </Section>
          )}

          <Hr style={styles.divider} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Este email fue enviado por el equipo de{" "}
              <Link href={appUrl} style={styles.footerLink}>
                DECKLAB SHOP
              </Link>
              .
            </Text>
            <Text style={styles.footerText}>
              Si no esperabas este mensaje, puedes ignorarlo.
            </Text>
            <Text style={styles.footerTextFaint}>
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
  badge: {
    display: "inline-block",
    borderRadius: "100px",
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.18em",
    padding: "4px 12px",
    margin: "0 0 16px",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: 800,
    margin: "0 0 12px",
    lineHeight: "1.25",
  },
  greeting: {
    color: "#9c9c9d",
    fontSize: "15px",
    margin: "0",
    lineHeight: "1.5",
  },
  divider: {
    borderColor: "#1b1c1e",
    borderTopWidth: "1px",
    margin: 0,
  },
  bodySection: {
    padding: "28px 32px",
  },
  bodyText: {
    color: "#c4c4c5",
    fontSize: "14px",
    lineHeight: "1.65",
    margin: "0 0 12px",
  },
  ctaSection: {
    padding: "4px 32px 32px",
    textAlign: "center",
  },
  ctaButton: {
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
    color: "#545556",
    fontSize: "11px",
    margin: "4px 0",
    lineHeight: "1.5",
  },
  footerTextFaint: {
    color: "#363738",
    fontSize: "10px",
    margin: "8px 0 0",
    letterSpacing: "0.05em",
  },
  footerLink: {
    color: "#6a6b6c",
    textDecoration: "underline",
  },
};

export default CustomEmail;
