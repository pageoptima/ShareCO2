"use server";

import { auth } from "@/lib/auth/auth";
import {
  getWalletByUserId,
  getWalletTransactions,
} from "@/lib/wallet/walletServices";
import { requestTopUp as requestTopUpDb } from "@/lib/transaction/requestTopUp";
import { PublicWallet, PublicWalletTransaction } from "./types";

/**
 * Fetch the wallet for the authenticated user
 */
export async function getWallet(): Promise<PublicWallet> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to view your wallet");
  }

  const wallet = await getWalletByUserId(session.user.id);

  return {
    id: wallet.id,
    spendableBalance: wallet.spendableBalance,
    reservedBalance: wallet.reservedBalance,
    totalBalance: wallet.spendableBalance + wallet.reservedBalance,
  };
}

/**
 * Fetch wallet transactions for the authenticated user
 */
export async function getTransactions({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}): Promise<{ transactions: PublicWalletTransaction[]; total: number }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const { transactions, total } = await getWalletTransactions({
    userId: session.user.id,
    page,
    limit,
  });

  return {
    transactions: transactions.map((txn) => ({
      id: txn.id,
      amount: txn.amount,
      direction: txn.direction,
      purpose: txn.purpose,
      description: txn.description || "",
      createdAt: txn.createdAt,
      rideId: txn.rideId,
    })),
    total,
  };
}

/**
 * Submit a top-up request for carbon points
 */
export async function requestTopUp(amount: number) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const success = await requestTopUpDb({
    userId: session.user.id,
    amount,
  });

  return success;
}
