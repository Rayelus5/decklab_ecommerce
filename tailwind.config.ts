import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Fondo base oscuro (casi negro pero no #000 para evitar contraste excesivo en textos)
                background: "#09090b",
                foreground: "#fafafa",

                // Colores de superficie (tarjetas, modales)
                card: {
                    DEFAULT: "#18181b",
                    foreground: "#fafafa",
                },

                // Elementos interactivos
                primary: {
                    DEFAULT: "#fafafa", // Blanco suave para acciones principales
                    foreground: "#18181b",
                },
                secondary: {
                    DEFAULT: "#27272a",
                    foreground: "#fafafa",
                },
                muted: {
                    DEFAULT: "#27272a",
                    foreground: "#a1a1aa",
                },
                accent: {
                    DEFAULT: "#27272a",
                    foreground: "#fafafa",
                },

                // Bordes sutiles
                border: "#27272a",
                input: "#27272a",
                ring: "#d4d4d8",

                // Color para destacar 'PRO' features (ej. un dorado sutil o violeta neón suave)
                pro: {
                    DEFAULT: "#8b5cf6", // Violeta sutil
                    foreground: "#ffffff"
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
};
export default config;