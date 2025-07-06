// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Check, X } from "lucide-react";
// import { toast } from "sonner";
// import { getRechargeRequests, processRechargeRequest } from "@/app/_actions/getRechargeRequests";
// import { rupeesToCarbonPoints, formatCarbonPointsForUI } from "@/utils/carbonPointsConversion";
// import { formatDate } from "@/utils/formatTime";

// interface TopUpRequest {
//   id: string;
//   userId: string;
//   amount: number;
//   phoneNumber: string;
//   status: string;
//   createdAt: string;
//   adminComment?: string | null;
//   user: {
//     email: string;
//     name?: string | null;
//   };
// }

// interface AdminUser {
//   id: string;
//   email: string;
//   isAdmin?: boolean;
//   name?: string;
// }

// export default function RechargeRequestsPage() {
//   const router = useRouter();
//   const { data: session, status } = useSession();
//   const [isLoading, setIsLoading] = useState(true);
//   const [requests, setRequests] = useState<TopUpRequest[]>([]);
//   const [processingId, setProcessingId] = useState<string | null>(null);

//   const fetchRequests = async () => {
//     try {
//       setIsLoading(true);
//       const data = await getRechargeRequests();
//       // const data = [];
//       setRequests(data);
//     } catch (error) {
//       console.error("Error fetching recharge requests:", error);
//       toast.error("Failed to load recharge requests");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Check for admin access
//     if (status === "unauthenticated") {
//       router.push("/");
//       return;
//     }

//     if (status === "authenticated") {
//       const user = session.user as AdminUser;
//       if (!user?.isAdmin) {
//         toast.error("You don't have permission to access this page");
//         router.push("/dashboard");
//         return;
//       }

//       fetchRequests();
//     }
//   }, [status, session, router]);

//   const handleApprove = async (id: string) => {
//     try {
//       setProcessingId(id);
//       const result = await processRechargeRequest(id, "APPROVED", "Approved by admin");
      
//       if (result.error) {
//         toast.error(result.error);
//       } else {
//         toast.success("Request approved successfully");
//         // Refresh the list
//         fetchRequests();
//       }
//     } catch (error) {
//       console.error("Error approving request:", error);
//       toast.error("Failed to approve request");
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const handleReject = async (id: string) => {
//     try {
//       setProcessingId(id);
//       const result = await processRechargeRequest(id, "REJECTED", "Rejected by admin");
      
//       if (result.error) {
//         toast.error(result.error);
//       } else {
//         toast.success("Request rejected successfully");
//         // Refresh the list
//         fetchRequests();
//       }
//     } catch (error) {
//       console.error("Error rejecting request:", error);
//       toast.error("Failed to reject request");
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="container mx-auto p-4">
//         <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-4 pb-20">
//       <h1 className="text-2xl font-bold text-white mb-4">Recharge Requests</h1>
//       <p className="text-sm text-gray-400 mb-4">
//         Conversion Rate: ₹18 = 1.00 Carbon Point (Precise decimal calculation)
//       </p>
      
//       <Button 
//         onClick={fetchRequests} 
//         className="mb-4 bg-emerald-700 hover:bg-emerald-800"
//       >
//         Refresh
//       </Button>
      
//       {requests.length === 0 ? (
//         <p className="text-white">No pending recharge requests.</p>
//       ) : (
//         <div className="grid gap-4">
//           {requests.map((request) => (
//             <Card key={request.id} className="bg-[#1A3C34] text-white border-none">
//               <CardHeader>
//                 <CardTitle className="flex justify-between">
//                   <span>₹{request.amount}</span>
//                   <span className={`px-2 py-1 rounded-full text-xs ${
//                     request.status === "PENDING" ? "bg-yellow-500 text-black" :
//                     request.status === "APPROVED" ? "bg-green-500 text-black" :
//                     "bg-red-500 text-white"
//                   }`}>
//                     {request.status}
//                   </span>
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-2">
//                   <p><strong>User:</strong> {request.user.name || request.user.email}</p>
//                   <p><strong>Phone:</strong> {request.phoneNumber}</p>
//                   <p><strong>Date:</strong> {formatDate(request.createdAt)}</p>
//                   <div className="bg-emerald-500/10 p-2 rounded text-sm">
//                     <p><strong>Conversion:</strong> ₹{request.amount} → {formatCarbonPointsForUI(rupeesToCarbonPoints(request.amount))} Carbon Points</p>
//                     <p className="text-emerald-400 text-xs">
//                       Precise decimal calculation - no rounding loss
//                     </p>
//                   </div>
                  
//                   {request.adminComment && (
//                     <p><strong>Admin Comment:</strong> {request.adminComment}</p>
//                   )}
                  
//                   {request.status === "PENDING" && (
//                     <div className="flex gap-2 mt-4">
//                       <Button 
//                         onClick={() => handleApprove(request.id)}
//                         className="flex-1 bg-green-600 hover:bg-green-700"
//                         disabled={processingId === request.id}
//                       >
//                         <Check className="mr-2 h-4 w-4" />
//                         {processingId === request.id ? "Processing..." : "Approve"}
//                       </Button>
//                       <Button 
//                         onClick={() => handleReject(request.id)}
//                         className="flex-1 bg-red-600 hover:bg-red-700"
//                         disabled={processingId === request.id}
//                       >
//                         <X className="mr-2 h-4 w-4" />
//                         {processingId === request.id ? "Processing..." : "Reject"}
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

const RechargeRequestsPage = () => {
  return (
    <div>Not implemented</div>
  );
}

export default RechargeRequestsPage;