import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "../actions";

const WalletBalance = () => {
  // Fetch wallet data
  const {
    data: wallet,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });

  if (isLoading) {
    return <div>Loading wallet...</div>;
  }

  if (isError) {
    console.error(error);
    return <div>Error loading wallet</div>;
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center">
          <WalletIcon className="h-5 w-5 mr-2 text-emerald-400" />
          Wallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {wallet?.totalBalance.toFixed(2)} CP
          </p>
          <div className="flex justify-center gap-4 mt-2 text-sm text-gray-300">
            <p>Available: {wallet?.spendableBalance.toFixed(2)}</p>
            <p>Reserved: {wallet?.reservedBalance.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
            Top Up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletBalance;
