"use server";

import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addAddress(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const rawData = {
        line1: formData.get("line1") as string,
        city: formData.get("city") as string,
        postalCode: formData.get("postalCode") as string,
        country: formData.get("country") as string,
        label: formData.get("label") as string || "Casa",
        phone: formData.get("phone") as string || "",
    };

    try {
        await prisma.address.create({
            data: {
                ...rawData,
                userId: session.user.id,
            }
        });
        revalidatePath("/profile/addresses");
        return { success: "Dirección añadida" };
    } catch (error) {
        return { error: "Error al guardar dirección" };
    }
}

export async function deleteAddress(addressId: string) {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    try {
        await prisma.address.delete({
            where: { id: addressId, userId: session.user.id } // Asegurar que pertenece al user
        });
        revalidatePath("/profile/addresses");
        return { success: "Dirección eliminada" };
    } catch (error) {
        return { error: "Error al eliminar" };
    }
}