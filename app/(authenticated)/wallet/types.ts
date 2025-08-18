export type WalletTransactionDirection = "CREDIT" | "DEBIT" | "NEUTRAL";
export type WalletTransactionPurpose =
  | "TOPUP"
  | "BOOKING_RESERVE"
  | "BOOKING_RELEASE"
  | "BOOKING_SETTLE"
  | "PAYOUT"
  | "REFUND"
  | "FINE_CHARGE"
  | "PROMOTION"
  | "ADJUSTMENT";

export interface PublicWallet {
  id: string;
  spendableBalance: number;
  reservedBalance: number;
  totalBalance: number;
}

export interface PublicWalletTransaction {
  id: string;
  amount: number;
  direction: WalletTransactionDirection;
  purpose: WalletTransactionPurpose;
  description: string;
  createdAt: Date;
  rideId: string | null;
  paymentId?: string | null;
}
