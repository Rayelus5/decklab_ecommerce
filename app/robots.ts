import type { MetadataRoute } from "next";

// Tienda privada. robots.txt se genera estático en build (servirlo no cuesta CPU).
// Solo lo respetan los bots "educados"; los agresivos se cortan en Vercel Firewall.

// Crawlers de IA y scrapers de SEO: bloqueo total (incluido /legal).
const BLOCKED_BOTS = [
  // IA / LLM
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "PerplexityBot",
  "Perplexity-User",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "meta-externalfetcher",
  "FacebookBot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "MistralAI-User",
  "DuckAssistBot",
  "AI2Bot",
  "Diffbot",
  "YouBot",
  "Timpibot",
  "ImagesiftBot",
  "Omgilibot",
  "img2dataset",
  // SEO / scraping
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "Barkrowler",
  "PetalBot",
  "SeekportBot",
  "serpstatbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: "/" },
      // Resto (buscadores): solo las páginas legales, que ya se marcan
      // como indexables en app/(public)/legal/layout.tsx.
      { userAgent: "*", allow: "/legal/", disallow: "/" },
    ],
  };
}
