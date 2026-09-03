import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCtor?: typeof PrismaClient;
};

function createClient() {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
}

function getClient(): PrismaClient {
  if (globalForPrisma.prisma && globalForPrisma.prismaCtor === PrismaClient) {
    return globalForPrisma.prisma;
  }
  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaCtor = PrismaClient;
  }
  return client;
}

export const prisma = getClient();
