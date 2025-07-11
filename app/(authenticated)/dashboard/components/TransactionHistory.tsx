import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCarbonPointsForUI } from "@/utils/carbonPointsConversion";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "../actions";

export function TransactionHistory() {

    // Hook for fetching the transactions
    const {
        data: transactions = [],
        isLoading: isTransactionsFetching,
        isError: isTransactionsFetchingError,
        error: transactionsFetchingError,
    } = useQuery({
        queryKey: ['transactions'],
        queryFn: getTransactions,
    });

    if ( isTransactionsFetchingError ) {
        console.error( transactionsFetchingError );
    }

    if ( isTransactionsFetching ) {
        return (<div>Transaction fetching loading should be implemented.</div>)
    }

    return (
        <Card className="bg-[#1A3C34] text-white border-none">
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <div className="space-y-4">
                        {transactions.map((txn) => (
                            <div
                                key={txn.id}
                                className="flex justify-between items-center p-3 bg-[#2F4F4F] rounded-lg"
                            >
                                <div>
                                    <p className="text-sm">{txn.description}</p>
                                    <p className="text-xs text-gray-400">
                                        {utcIsoToLocalDate(txn.createdAt)} <pre>  </pre> {utcIsoToLocalTime12(txn.createdAt)}
                                    </p>
                                </div>
                                <p
                                    className={
                                        txn.type.toLowerCase() === "credit" ? "text-green-400" : "text-red-400"
                                    }
                                >
                                    {txn.type.toLowerCase() === "credit" ? "+" : "-"}{formatCarbonPointsForUI(txn.amount)} CP
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}