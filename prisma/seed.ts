import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = "demo@financemanager.app";

async function main() {
  console.log("🌱 Running seed...");

  const { count } = await prisma.user.deleteMany({
    where: { email: DEMO_USER_EMAIL },
  });

  if (count > 0) {
    console.log(`✅ Removed legacy demo user: ${DEMO_USER_EMAIL}`);
  } else {
    console.log("ℹ️ No legacy demo user found");
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
