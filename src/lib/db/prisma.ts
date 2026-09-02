import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Use WebSocket for non-edge environments (Node.js)
if (typeof WebSocket === "undefined" && typeof window === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    return new PrismaClient();
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

/** Detect stale global Prisma client after `prisma generate` without dev server restart */
function isStalePrismaClient(client: PrismaClient): boolean {
  return (
    !("savingsGoal" in client) ||
    !("categoryRule" in client) ||
    !("transactionSplit" in client) ||
    !("creditCardEmi" in client) ||
    !("investment" in client)
  );
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && (process.env.NODE_ENV === "production" || !isStalePrismaClient(cached))) {
    return cached;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
