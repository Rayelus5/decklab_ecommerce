import type { MetadataRoute } from "next";

// Proyecto privado: ningún crawler (buscadores ni bots de IA) debe indexar nada.
// Se genera estático en build, así que servirlo no consume CPU.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", disallow: "/" }],
    };
}
