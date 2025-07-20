import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getWalletByUserId } from "@/lib/wallet/walletServices";

export async function GET() {
  // Auth check and get the user id.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const wallet = await getWalletByUserId(session.user.id);

  const carbonPoint = wallet.spendableBalance + wallet.reservedBalance;
  return NextResponse.json(carbonPoint, { status: 201 });
}
