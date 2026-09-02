"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { CreditCardFormModal } from "./CreditCardFormModal";

export function CreditCardsEmpty() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="space-y-4 lg:space-y-6">
        <PageHeader
          title="Credit Cards"
          description="Manage your cards, outstanding balances and EMI commitments."
          action={
            <Button size="sm" onClick={() => setShowAdd(true)}>
              Add Credit Card
            </Button>
          }
        />
        <EmptyState
          icon={CreditCard}
          title="No credit cards yet"
          description="Add a credit card to track limits, outstanding balances, EMIs, and spending."
        />
        <div className="flex justify-center">
          <Link href="/import">
            <Button variant="secondary" size="sm">
              Or import a credit card statement
            </Button>
          </Link>
        </div>
      </div>
      <CreditCardFormModal open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}
