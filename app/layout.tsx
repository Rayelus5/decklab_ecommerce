import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
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
    process.env.NEXT_PUBLIC_APP_URL ?? "https://decklab.rayelus.com"
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
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

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
