"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, CreditCard, Banknote, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { createAccountAction, deleteAccountAction } from "@/actions/accounts";
import { toast } from "sonner";
import Link from "next/link";

interface AccountWithBalance {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  lastFour: string | null;
  isDefault: boolean;
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  transactionCount: number;
}

const typeIcons: Record<string, typeof Wallet> = {
  BANK: Wallet,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  OTHER: Wallet,
};

export function AccountsClient({ accounts }: { accounts: AccountWithBalance[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const result = await createAccountAction(formData);
    setCreating(false);
    if (result.success) {
      toast.success(result.message);
      setShowCreate(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAccountAction(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const Icon = typeIcons[account.type] || Wallet;
          return (
            <Card key={account.id} padding="md" hover>
              <Link href={`/transactions?accountId=${account.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[var(--color-ink-muted)]" />
                    </div>
                    <div>
                      <p className="title-md text-[var(--color-ink)]">{account.name}</p>
                      <p className="caption-sm text-[var(--color-ink-muted)]">
                        {account.type.replace("_", " ")}
                        {account.lastFour && ` ···${account.lastFour}`}
                      </p>
                    </div>
                  </div>
                  {!account.isDefault && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(account.id); }}
                      className="p-2 text-[var(--color-ink-faint)] hover:text-[var(--color-error)] min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="display-sm text-[var(--color-ink)] mb-3">
                  {formatCurrency(account.balance)}
                </p>

                <div className="flex gap-4 caption-sm text-[var(--color-ink-muted)]">
                  <span>In: {formatCurrency(account.monthIncome)}</span>
                  <span>Out: {formatCurrency(account.monthExpenses)}</span>
                  <span>{account.transactionCount} txns</span>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="Add Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="caption text-[var(--color-ink-muted)] block mb-1.5">Name</label>
            <input name="name" required className="w-full h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm" placeholder="HDFC Savings" />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] block mb-1.5">Type</label>
            <select name="type" className="w-full h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm">
              <option value="BANK">Bank</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] block mb-1.5">Institution (optional)</label>
            <input name="institution" className="w-full h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm" />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] block mb-1.5">Last 4 digits (optional)</label>
            <input name="lastFour" maxLength={4} className="w-full h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm" />
          </div>
          <Button type="submit" fullWidth disabled={creating}>
            {creating ? "Creating…" : "Create Account"}
          </Button>
        </form>
      </Sheet>
    </>
  );
}
