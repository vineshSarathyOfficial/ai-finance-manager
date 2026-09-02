export interface CreditCardMetrics {
  creditLimit: number | null;
  openingOutstanding: number;
  currentOutstanding: number;
  availableCredit: number | null;
  utilizationPct: number | null;
  newSpending: number;
  totalPayments: number;
  totalRefunds: number;
  spendThisMonth: number;
  spendLastMonth: number;
  activeEmiCount: number;
  monthlyEmiCommitment: number;
  emiOutstanding: number;
  billingCycleLabel: string | null;
  paymentDueLabel: string | null;
}

export interface SerializedCreditCard {
  id: string;
  name: string;
  institution: string | null;
  lastFour: string | null;
  creditLimit: number | null;
  openingOutstanding: number;
  billingCycleDay: number | null;
  paymentDueDay: number | null;
  metrics: CreditCardMetrics;
}

export interface SerializedCreditCardEmi {
  id: string;
  accountId: string;
  name: string;
  originalAmount: number;
  monthlyAmount: number;
  remainingPrincipal: number;
  totalTenureMonths: number;
  remainingMonths: number;
  startDate: string;
  endDate: string | null;
  interestRate: number | null;
  processingFee: number | null;
  status: "ACTIVE" | "COMPLETED";
}

export interface CreditCardAnalytics {
  spendThisMonth: number;
  spendLastMonth: number;
  topMerchants: Array<{ name: string; totalAmount: number }>;
  categoryBreakdown: Array<{ name: string; icon: string | null; amount: number }>;
  monthlyTrend: Array<{ month: string; expenses: number }>;
}
