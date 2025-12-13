"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Definimos los países que consideramos "Nacionales" (Solo España por ahora)
const NATIONAL_CODES = ["ES", "ESP"];

export async function getShippingRates(weightInGrams: number, countryCode: string) {
    try {
        // 1. Determinar región
        const isNational = NATIONAL_CODES.includes(countryCode.toUpperCase());
        const region = isNational ? "NATIONAL" : "EUROPE";

        // 2. Buscar tarifas que coincidan con la región y el rango de peso
        const rates = await prisma.shippingRate.findMany({
            where: {
                region: region,
                minWeight: { lte: weightInGrams }, // Peso mínimo <= Peso actual
                maxWeight: { gte: weightInGrams }, // Peso máximo >= Peso actual
                active: true,
            },
            orderBy: {
                price: 'asc', // Ordenar por precio (más barato primero)
            },
        });

        return { success: true, rates };
    } catch (error) {
        console.error("Error fetching rates:", error);
        return { success: false, error: "No se pudieron calcular las tarifas" };
    }
}