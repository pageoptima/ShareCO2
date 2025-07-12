// lib/wallet.ts

import { prisma } from "@/config/prisma";
import {
  Prisma,
  WalletTransactionDirection,
  WalletTransactionPurpose,
} from "@prisma/client";

/**
 * Fetch the wallet for a given user ID.
 * Throws if wallet is not found.
 */
export async function getWalletByUserId(userId: string) {
  // Find the wallet by user id
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error(`Wallet not found for user ${userId}`);
  }

  return wallet;
}

/**
 * Get the wallet transection for the user
 */
export async function getWalletTransactions({
  userId,
  page = 1,
  limit = 10,
}: {
  userId: string;
  page: number;
  limit: number;
}) {
  const skip = (page - 1) * limit;

  // Find wallet ID from userId
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!wallet) {
    throw new Error(`Wallet not found for user ${userId}`);
  }

  // Fetch paginated transactions
  const [transactions, total] = await prisma.$transaction([
    prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        direction: { not: "NEUTRAL" },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    }),
    prisma.walletTransaction.count({
      where: { walletId: wallet.id },
    }),
  ]);

  //console.log("transactions", transactions)
  return {
    transactions,
    total,
  };
}

/**
 * Ensure the user has at least `amount` in their spendable (available) balance.
 */
export async function hasSufficientSpendableBalance({
  tx,
  userId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  amount: number;
}): Promise<boolean> {
  const wallet = await tx.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet.spendableBalance > amount;
}

/**
 *   Hold the ride cost:
 *   – moves `amount` from availableBalance → lockedBalance
 *   – logs a NEUTRAL / BOOKING_RESERVE transaction
 */
export async function holdRideCost({
  tx,
  userId,
  rideId,
  rideBookId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  rideId: string;
  rideBookId: string;
  amount: number;
}): Promise<void> {
  await tx.wallet.update({
    where: { userId },
    data: {
      spendableBalance: { decrement: amount },
      reservedBalance: { increment: amount },
      transactions: {
        create: {
          amount: 0,
          direction: WalletTransactionDirection.NEUTRAL,
          purpose: WalletTransactionPurpose.BOOKING_RESERVE,
          ride: { connect: { id: rideId } },
          rideBook: { connect: { id: rideBookId } },
          description: `Reserved ${amount} coins for ride-booking ${rideBookId}`,
        },
      },
    },
  });
}

/**
 *  Unhold ride cost:
 * - moves `amount` from reservedBalance → spendableBalance
 * - logs a NEUTRAL / BOOKING_RELEASE transaction
 */
export async function unholdRideCost({
  tx,
  userId,
  rideId,
  rideBookId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  rideId: string;
  rideBookId: string;
  amount: number;
}): Promise<boolean> {
  // Check if unhold already exists
  const alreadyReleased = await tx.walletTransaction.findFirst({
    where: {
      rideBookId,
      purpose: WalletTransactionPurpose.BOOKING_RELEASE,
    },
  });

  if (alreadyReleased) {
    return false;
  }

  await tx.wallet.update({
    where: { userId },
    data: {
      spendableBalance: { increment: amount },
      reservedBalance: { decrement: amount },
      transactions: {
        create: {
          amount: 0,
          direction: WalletTransactionDirection.NEUTRAL,
          purpose: WalletTransactionPurpose.BOOKING_RELEASE,
          ride: { connect: { id: rideId } },
          rideBook: { connect: { id: rideBookId } },
          description: `Released ${amount} coins from hold for ride-booking ${rideBookId}`,
        },
      },
    },
  });

  return true;
}

/**
 * Settle ride cost after ride completion:
 * - deducts `amount` from reservedBalance (effectively finalizing the debit)
 * - logs a DEBIT / BOOKING_SETTLE transaction
 */
export async function settleRideCost({
  tx,
  userId,
  rideId,
  rideBookId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  rideId: string;
  rideBookId: string;
  amount: number;
}): Promise<boolean> {
  // Check for prevent duplicate settlement
  const alreadySettled = await tx.walletTransaction.findFirst({
    where: {
      rideBookId,
      purpose: WalletTransactionPurpose.BOOKING_SETTLE,
    },
  });

  if (alreadySettled) {
    return false;
  }

  // Deduct reserved funds (finalize the debit)
  await tx.wallet.update({
    where: { userId },
    data: {
      reservedBalance: { decrement: amount },
      transactions: {
        create: {
          amount: -amount,
          direction: WalletTransactionDirection.DEBIT,
          purpose: WalletTransactionPurpose.BOOKING_SETTLE,
          ride: { connect: { id: rideId } },
          rideBook: { connect: { id: rideBookId } },
          description: `Settled ${amount} coins for completed ride-booking ${rideBookId}`,
        },
      },
    },
  });

  return true;
}

/**
 * Credit driver payout:
 * - adds `amount` to driver's spendable balance
 * - logs a CREDIT / PAYOUT transaction
 */
export async function creditDriverPayout({
  tx,
  userId, // Driver id
  rideId,
  rideBookId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  rideId: string;
  rideBookId: string;
  amount: number;
}): Promise<boolean> {
  // Check to prevent duplicate payout
  const alreadyPaid = await tx.walletTransaction.findFirst({
    where: {
      rideBookId,
      purpose: WalletTransactionPurpose.PAYOUT,
    },
  });

  if (alreadyPaid) {
    return false;
  }

  await tx.wallet.update({
    where: { userId },
    data: {
      spendableBalance: { increment: amount },
      transactions: {
        create: {
          amount: amount,
          direction: WalletTransactionDirection.CREDIT,
          purpose: WalletTransactionPurpose.PAYOUT,
          ride: { connect: { id: rideId } },
          rideBook: { connect: { id: rideBookId } },
          description: `Credited ${amount} coins to champion for ride-booking ${rideBookId}`,
        },
      },
    },
  });

  return true;
}

/**
 * Apply a fine charge on ride booking violation
 * - ensures you don’t double‑charge the same booking
 * - decrements `spendableBalance` by `amount`
 * - logs a DEBIT / FINE_CHARGE transaction
 */
export async function applyFineChargeRidebooking({
  tx,
  userId,
  rideId,
  rideBookId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  rideId: string;
  rideBookId: string;
  amount: number;
}): Promise<boolean> {
  // Prevent duplicate fines for the same booking
  const alreadyFined = await tx.walletTransaction.findFirst({
    where: {
      rideBookId,
      purpose: WalletTransactionPurpose.FINE_CHARGE,
    },
  });

  if (alreadyFined) {
    return false;
  }

  // Apply the fine: debit the user
  await tx.wallet.update({
    where: { userId },
    data: {
      spendableBalance: { decrement: amount },
      transactions: {
        create: {
          amount: -amount,
          direction: WalletTransactionDirection.DEBIT,
          purpose: WalletTransactionPurpose.FINE_CHARGE,
          ride: { connect: { id: rideId } },
          rideBook: { connect: { id: rideBookId } },
          description: `Applied fine of ${amount} coins for ride-booking ${rideBookId}`,
        },
      },
    },
  });

  return true;
}

/**
 * Apply a fine charge on ride violation
 * - ensures you don’t double‑charge the same booking
 * - decrements `spendableBalance` by `amount`
 * - logs a DEBIT / FINE_CHARGE transaction
 */
export async function applyFineChargeRide({
  tx,
  userId,
  rideId,
  amount,
}: {
  tx: Prisma.TransactionClient;
  userId: string;
  rideId: string;
  amount: number;
}): Promise<boolean> {
  // Prevent duplicate fines for the same booking
  const alreadyFined = await tx.walletTransaction.findFirst({
    where: {
      rideId,
      purpose: WalletTransactionPurpose.FINE_CHARGE,
    },
  });

  if (alreadyFined) {
    return false;
  }

  // Apply the fine: debit the user
  await tx.wallet.update({
    where: { userId },
    data: {
      spendableBalance: { decrement: amount },
      transactions: {
        create: {
          amount: -amount,
          direction: WalletTransactionDirection.DEBIT,
          purpose: WalletTransactionPurpose.FINE_CHARGE,
          ride: { connect: { id: rideId } },
          description: `Applied fine of ${amount} coins for ride ${rideId}`,
        },
      },
    },
  });

  return true;
}
