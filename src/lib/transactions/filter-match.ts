import type { SerializedTransaction } from "@/types/finance";
import type { TransactionFilters } from "@/lib/validations/transaction";

type FilterableTransaction = Pick<
  SerializedTransaction,
  | "type"
  | "categoryId"
  | "accountId"
  | "paymentMethod"
  | "transactionKind"
  | "amount"
  | "description"
  | "merchantName"
  | "transactionDate"
>;

export function matchesTransactionFilters(
  tx: FilterableTransaction,
  filters: TransactionFilters
): boolean {
  const {
    search,
    type,
    categoryId,
    accountId,
    merchant,
    paymentMethod,
    transactionKind,
    minAmount,
    maxAmount,
    excludeTransfers,
    dateFrom,
    dateTo,
  } = filters;

  if (type && type !== "ALL" && tx.type !== type) return false;
  if (categoryId && tx.categoryId !== categoryId) return false;
  if (accountId && tx.accountId !== accountId) return false;

  if (paymentMethod) {
    const method = tx.paymentMethod?.toLowerCase() ?? "";
    if (!method.includes(paymentMethod.toLowerCase())) return false;
  }

  if (transactionKind && transactionKind !== "ALL" && tx.transactionKind !== transactionKind) {
    return false;
  }

  if (excludeTransfers) {
    if (tx.transactionKind === "TRANSFER" || tx.transactionKind === "CC_PAYMENT" || tx.transactionKind === "EXCLUDED") {
      return false;
    }
  }

  if (search) {
    const query = search.toLowerCase();
    const inDescription = tx.description.toLowerCase().includes(query);
    const inMerchant = (tx.merchantName ?? "").toLowerCase().includes(query);
    if (!inDescription && !inMerchant) return false;
  }

  if (merchant) {
    const query = merchant.toLowerCase();
    if (!(tx.merchantName ?? "").toLowerCase().includes(query)) return false;
  }

  if (minAmount !== undefined && tx.amount < minAmount) return false;
  if (maxAmount !== undefined && tx.amount > maxAmount) return false;

  if (dateFrom || dateTo) {
    const date = new Date(tx.transactionDate);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(`${dateTo}T23:59:59`)) return false;
  }

  return true;
}
