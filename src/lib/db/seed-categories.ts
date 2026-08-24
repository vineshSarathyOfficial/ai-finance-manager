import "server-only";
import { prisma } from "@/lib/db/prisma";

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

export async function seedDefaultCategories(userId: string) {
  const all = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "EXPENSE" as const })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "INCOME" as const })),
  ];

  for (const cat of all) {
    await prisma.category.upsert({
      where: {
        userId_name_type: { userId, name: cat.name, type: cat.type },
      },
      update: {},
      create: { userId, name: cat.name, type: cat.type, icon: cat.icon },
    });
  }
}
