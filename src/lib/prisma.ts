import { PrismaClient } from "@prisma/client";

// Una sola instancia por proceso: cada `new PrismaClient()` arranca su propio
// motor y pool de conexiones, lo que encarece los cold starts y satura Neon.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
