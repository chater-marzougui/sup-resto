import { TransactionTypeBadge } from "@/components/elements/transaction-type-badge";
import {
  formatCurrency,
  formatDate,
  getRoleNameByNumber,
} from "@/lib/utils/main-utils";
import { TransactionWithProcessedBy,transactionWithProcessedByValidator, transactionWithUserValidator, TransactionWithUser } from "@/server/trpc/validators/transactions-validator";

const TransactionLine: React.FC<{
  transaction: TransactionWithUser | TransactionWithProcessedBy;
}> = ({ transaction }) => {
  let processedBy = "Unknown";

  try {
    transaction = transactionWithProcessedByValidator.parse(transaction);
    processedBy =
      transaction.userId === transaction.processedByUser?.id
        ? "You"
        : transaction.processedByUser
        ? getRoleNameByNumber(transaction.processedByUser.role)
        : "Transaction";
  } catch (error) {
    transaction = transactionWithUserValidator.parse(transaction);
    processedBy =
      transaction.processedBy === transaction.user?.id
        ? "You"
        : transaction.user
        ? `${transaction.user.firstName} ${transaction.user.lastName}`
        : "Transaction";

  }

  const isPositive = transaction.amount > 0;

  return (
    <div
      key={transaction.id}
      className="flex justify-between items-center py-3 border-b last:border-b-0 hover:bg-muted/50 px-2 rounded"
    >
      <div className="flex items-center space-x-3">
        <TransactionTypeBadge type={transaction.type} />
        <div>
          <p className="text-sm font-medium">{processedBy}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`font-medium text-${isPositive ? "green" : "red"}-600`}
        >
          {isPositive ? "+" : ""}
          {formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  );
};

export default TransactionLine;
