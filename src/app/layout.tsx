import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Providers } from "@/components/providers";
import { auth } from "@/lib/auth";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-untitled-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-aeonikpro",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dotdigital",
});

export const metadata: Metadata = {
  title: "DECKLAB SHOP",
  description: "Tienda exclusiva para miembros PRO",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} bg-midnight-abyss text-comet font-untitled-sans min-h-screen flex flex-col antialiased`}>
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          
          <footer className="border-t border-white/5 py-6 text-center text-caption text-whisper-blue">
            © {new Date().getFullYear()} Decklab Shop. Todos los derechos reservados.
          </footer>
        </Providers>
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'rgba(5,6,15,0.97)',
              border: '1px solid rgba(186,215,247,0.12)',
              color: '#d8ecf8',
              borderRadius: '12px'
            }
          }}
        />
      </body>
    </html>
  );
}