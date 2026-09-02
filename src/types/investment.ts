export type InvestmentType = "SIP" | "EPFO" | "LUMP_SUM" | "FD" | "OTHER";

export interface SerializedInvestment {
  id: string;
  type: InvestmentType;
  name: string;
  institution: string | null;
  currentValue: number;
  investedAmount: number | null;
  monthlyContribution: number | null;
  employerContribution: number | null;
  startDate: string | null;
  targetAmount: number | null;
  notes: string | null;
  lastValueUpdate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentSummary {
  totalValue: number;
  totalInvested: number;
  monthlyCommitment: number;
  sipCount: number;
  epfoCount: number;
  gainLoss: number | null;
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  SIP: "SIP (Mutual Fund)",
  EPFO: "EPFO / Provident Fund",
  LUMP_SUM: "Lump Sum",
  FD: "Fixed Deposit",
  OTHER: "Other",
};
