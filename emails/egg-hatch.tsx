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
import { Img } from "@react-email/img";

const RARITY_LABELS: Record<string, string> = {
  COMMON:    "Común",
  UNCOMMON:  "Poco común",
  RARE:      "Raro",
  EPIC:      "Épico",
  LEGENDARY: "Legendario",
  MYTHIC:    "Mítico",
};

interface EggHatchProps {
  customerName: string;
  pokemonName: string;
  pokedexNumber: number;
  eggRarity: string;
  artworkUrl: string;
  appUrl?: string;
}

export function EggHatch({
  customerName,
  pokemonName,
  pokedexNumber,
  eggRarity,
  artworkUrl,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com",
}: EggHatchProps) {
  const rarityLabel = RARITY_LABELS[eggRarity] ?? eggRarity;
  const formattedNumber = String(pokedexNumber).padStart(3, "0");
  const displayName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1).replace(/-/g, " ");

  return (
    <Html lang="es">
      <Head />
      <Preview>{`¡Tu huevo ha eclosionado! Apareció ${displayName} — DECKLAB SHOP`}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.logo}>DECKLAB</Heading>
            <Text style={styles.headerSub}>SHOP</Text>
          </Section>

          {/* Hero */}
          <Section style={styles.hero}>
            <Text style={styles.rarityBadge}>{rarityLabel}</Text>
            <Heading as="h2" style={styles.heroTitle}>
              ¡Tu huevo ha eclosionado!
            </Heading>
            <Text style={styles.heroText}>
              Hola {customerName}, has obtenido un nuevo Pokémon para tu colección.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Pokémon Card */}
          <Section style={styles.pokemonSection}>
            <Section style={styles.pokemonCard}>
              <Text style={styles.pokedexNumber}>No. {formattedNumber}</Text>
              <Img
                src={artworkUrl}
                alt={displayName}
                width="160"
                height="160"
                style={styles.pokemonImage}
              />
              <Heading as="h3" style={styles.pokemonName}>{displayName}</Heading>
              <Text style={styles.pokemonRarity}>Huevo {rarityLabel}</Text>
            </Section>
          </Section>

          <Hr style={styles.divider} />

          {/* CTA */}
          <Section style={styles.ctaSection}>
            <Text style={styles.ctaText}>
              Puedes ver a tu nuevo Pokémon en tu colección y empezar a prepararlo para las batallas.
            </Text>
            <Link href={`${appUrl}/profile/inventory`} style={styles.ctaButton}>
              Ver mi colección
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
  rarityBadge: {
    display: "inline-block",
    backgroundColor: "#1a1c1f",
    border: "1px solid #f59e0b40",
    color: "#f59e0b",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    borderRadius: "999px",
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
  pokemonSection: {
    padding: "32px",
    textAlign: "center",
  },
  pokemonCard: {
    backgroundColor: "#07080a",
    border: "1px solid #1b1c1e",
    borderRadius: "16px",
    padding: "32px 24px",
    textAlign: "center",
  },
  pokedexNumber: {
    color: "#454647",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: "0 0 16px",
  },
  pokemonImage: {
    display: "block",
    margin: "0 auto 16px",
    objectFit: "contain",
  },
  pokemonName: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 8px",
  },
  pokemonRarity: {
    color: "#f59e0b",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: 0,
  },
  ctaSection: {
    padding: "24px 32px",
    textAlign: "center",
  },
  ctaText: {
    color: "#9c9c9d",
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0 0 20px",
  },
  ctaButton: {
    backgroundColor: "#f59e0b",
    color: "#040506",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "14px",
    fontWeight: 700,
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

export default EggHatch;
