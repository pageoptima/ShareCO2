"use client";

import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import WalletBalance from "./components/WalletBalance";
import WalletTransactions from "./components/WalletTransactions";

export default function WalletPage() {
  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard" passHref>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 -ml-2 hover:cursor-pointer flex items-center"
          >
            <HomeIcon className="h-5 w-5 mr-1" />
            Home
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-white">My Wallet</h1>
        <div className="w-20"></div>
      </div>

      <div className="space-y-6">
        <WalletBalance />
        <WalletTransactions />
      </div>
    </div>
  );
}
