"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

// Esquema de validación
const RegisterSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registerUser(formData: FormData) {
    // 1. Validar datos
    const data = Object.fromEntries(formData.entries());
    const parsed = RegisterSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "Datos inválidos. Revisa los campos." };
    }

    const { name, email, password } = parsed.data;

    // 2. Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Este email ya está registrado." };
    }

    // 3. Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear usuario
    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                // Por defecto role: CUSTOMER, isPro: false
            },
        });
        return { success: true };
    } catch (error) {
        return { error: "Error al crear el usuario. Inténtalo de nuevo." };
    }
}