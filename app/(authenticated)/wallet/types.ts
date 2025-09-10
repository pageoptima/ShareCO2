import client from "@prisma/client";

export type WalletTransactionDirection = "CREDIT" | "DEBIT" | "NEUTRAL";
export type WalletTransactionPurpose = client.WalletTransactionPurpose;

export interface PublicWallet {
  id              : string;
  spendableBalance: number;
  reservedBalance : number;
  totalBalance    : number;
}

export interface PublicWalletTransaction {
  id          : string;
  amount      : number;
  direction   : WalletTransactionDirection;
  purpose     : WalletTransactionPurpose;
  description : string;
  createdAt   : Date;
  rideId      : string | null;
  paymentId  ?: string | null;
}
