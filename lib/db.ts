import { PrismaClient } from "@prisma/client";

// One Prisma client per server process (avoids too many connections in dev hot-reload).
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient | null = process.env.DATABASE_URL
  ? (g.prisma ??= new PrismaClient())
  : null;
