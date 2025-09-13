"use server";

import { auth } from "@/lib/auth/auth";
import { getWalletByUserId } from "@/lib/wallet/walletServices";
import { formatCarbonPointsForUI } from "@/utils/carbonPointsConversion";

/**
 * Get the carbon point of the user
 * @returns
 */
export async function getCarbonPoint(): Promise<string> {
  // Get authenticated user
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to view your carbon point");
  }

  // Get user's data
  const wallet = await getWalletByUserId(session.user.id);

  //console.log(user)

  // Calculate total balance
  const totalBalance = wallet.spendableBalance + wallet.reservedBalance;

  // Return formatted balance
  return formatCarbonPointsForUI(totalBalance);
}
