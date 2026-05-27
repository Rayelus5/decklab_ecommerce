import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DECKLAB — Pokémon TCG Premium",
    template: "%s | DECKLAB",
  },
  description:
    "DECKLAB es una tienda privada de productos de Pokémon TCG personalizados. Acceso exclusivo para miembros de nuestra comunidad.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.shop"
  ),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "DECKLAB",
  },
  robots: {
    index: false, // Tienda privada — no indexar
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-inter, Inter, system-ui, sans-serif)" }}
      >
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#111214",
              border: "1px solid #363739",
              color: "#ffffff",
            },
          }}
        />
      </body>
    </html>
  );
}
