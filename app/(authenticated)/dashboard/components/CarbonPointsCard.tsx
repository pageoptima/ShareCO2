"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCarbonPoint } from "../actions";

export function CarbonPointsCard() {
  const router = useRouter();

  const {
    data: carbonPoint = 0,
    isLoading: isCarbonPointFetching,
    isError: isCarbonPointFetchingError,
    error: carbonPointFetchingError,
  } = useQuery({
    queryKey: ["carbonpoint"],
    queryFn: getCarbonPoint,
  });

  if (isCarbonPointFetchingError) {
    console.error(carbonPointFetchingError);
  }

  if (isCarbonPointFetching) {
    return (
      <Card className="bg-[#1A3C34] text-white border-none">
        <CardContent className="space-y-4 p-6">
          <div className="text-center">
            <div className="h-4 w-24 bg-gray-600/50 rounded animate-pulse mx-auto mb-2" />
            <div className="h-8 w-32 bg-gray-600/50 rounded animate-pulse mx-auto" />
          </div>
          <div className="h-10 w-full bg-gray-600/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A3C34] text-white border-none">
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-300 text-center">Carbon Points</p>
          <p className="text-2xl font-semibold text-center">
            {carbonPoint.toFixed(2)} CP
          </p>
        </div>
        <Button
          className="w-full bg-[#2E7D32] hover:bg-[#388E3C] cursor-pointer"
          onClick={() => router.push("/topup")}
        >
          Top Up
        </Button>
      </CardContent>
    </Card>
  );
}