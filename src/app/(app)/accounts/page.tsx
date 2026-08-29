import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getAccountBalances } from "@/lib/db/accounts";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccountsClient } from "@/components/accounts/AccountsClient";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const userId = await getRequiredUserId();
  const accounts = await getAccountBalances(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts, credit cards, and cash"
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Accounts are created automatically when you import statements, or you can add one manually."
        />
      ) : (
        <AccountsClient accounts={accounts} />
      )}
    </div>
  );
}
