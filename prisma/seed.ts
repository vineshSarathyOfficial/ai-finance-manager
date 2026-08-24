import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "🍕" },
  { name: "Groceries", icon: "🛒" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Transport", icon: "🚌" },
  { name: "Fuel", icon: "⛽" },
  { name: "Bills", icon: "📄" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Education", icon: "📚" },
  { name: "Rent", icon: "🏠" },
  { name: "EMI", icon: "💳" },
  { name: "Other", icon: "📦" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "💼" },
  { name: "Business", icon: "🏢" },
  { name: "Freelance", icon: "💻" },
  { name: "Investment", icon: "📈" },
  { name: "Other", icon: "💰" },
];

async function seedCategories(userId: string) {
  const all = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "EXPENSE" as const })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "INCOME" as const })),
  ];
  for (const cat of all) {
    await prisma.category.upsert({
      where: { userId_name_type: { userId, name: cat.name, type: cat.type } },
      update: {},
      create: { userId, name: cat.name, type: cat.type, icon: cat.icon },
    });
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("demo1234!", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@financemanager.app" },
    update: {},
    create: { name: "Demo User", email: "demo@financemanager.app", passwordHash },
  });

  console.log(`✅ Demo user: ${demoUser.email}`);
  await seedCategories(demoUser.id);
  console.log("✅ Default categories seeded");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
