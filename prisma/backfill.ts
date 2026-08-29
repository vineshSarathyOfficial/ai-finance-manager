/**
 * Backfill script: run with `npm run db:backfill`
 * Adds default accounts, merchant names, and transaction classifications to existing data.
 */
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { classifyTransaction } from "../src/lib/finance/classification";
import { extractMerchantKey } from "../src/lib/categorization/narration";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL or DIRECT_URL must be set in .env");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(`Backfilling ${users.length} user(s)...`);

  for (const user of users) {
    let defaultAccount = await prisma.account.findFirst({
      where: { userId: user.id, isDefault: true },
    });

    if (!defaultAccount) {
      defaultAccount = await prisma.account.create({
        data: { userId: user.id, name: "Cash & Bank", type: "BANK", isDefault: true },
      });
      console.log(`  Created default account for user ${user.id}`);
    }

    let ccAccount = await prisma.account.findFirst({
      where: { userId: user.id, type: "CREDIT_CARD" },
    });

    const txs = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        description: true,
        type: true,
        paymentMethod: true,
        merchantName: true,
        accountId: true,
      },
    });

    let updated = 0;
    for (const tx of txs) {
      const classification = classifyTransaction(tx.description, tx.type, tx.paymentMethod);
      const merchantName = tx.merchantName || extractMerchantKey(tx.description);

      let accountId = tx.accountId;
      if (!accountId) {
        if (tx.paymentMethod?.toLowerCase().includes("credit card")) {
          if (!ccAccount) {
            ccAccount = await prisma.account.create({
              data: { userId: user.id, name: "Credit Card", type: "CREDIT_CARD" },
            });
          }
          accountId = ccAccount.id;
        } else {
          accountId = defaultAccount.id;
        }
      }

      const needsUpdate =
        tx.merchantName !== merchantName ||
        !tx.accountId ||
        accountId !== tx.accountId;

      if (!needsUpdate) continue;

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          merchantName,
          transactionKind: classification.kind,
          excludeFromTotals: classification.excludeFromTotals,
          accountId,
        },
      });
      updated++;
    }

    console.log(`  User ${user.id}: updated ${updated} of ${txs.length} transactions`);
  }

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
