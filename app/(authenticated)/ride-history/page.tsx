// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { 
//   Card, 
//   CardContent, 
//   CardDescription, 
//   CardHeader, 
//   CardTitle 
// } from "@/components/ui/card";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger
// } from "@/components/ui/tabs";
// import {
//   HomeIcon,
//   Calendar,
//   Clock,
//   MapPin,
//   Users,
//   Leaf,
//   ArrowUp,
//   ArrowDown
// } from "lucide-react";
// import { useAuth } from "../../_contexts/AuthContext";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Badge } from "@/components/ui/badge";
// import { formatDistanceToNow } from "date-fns";

// // Define ride status colors
// const getRideStatusColor = (status: string) => {
//   switch (status.toLowerCase()) {
//     case "completed":
//       return "bg-green-600 hover:bg-green-700";
//     case "cancelled":
//       return "bg-red-600 hover:bg-red-700";
//     case "in progress":
//       return "bg-blue-600 hover:bg-blue-700";
//     case "scheduled":
//       return "bg-amber-600 hover:bg-amber-700";
//     default:
//       return "bg-gray-600 hover:bg-gray-700";
//   }
// };

// // Define interfaces that match the actual data structure
// interface RideBase {
//   id: string;
//   from: string;
//   to: string;
//   date: string;
//   time: string;
//   status: string;
//   startingTime: string;
// }

// interface CreatedRide extends RideBase {
//   maxPassengers: number;
//   bookings: Array<{
//     id: string;
//     userEmail: string;
//     status: string;
//   }>;
// }

// interface RideCardProps {
//   ride: CreatedRide | RideBase;
//   type: "created" | "booked";
//   carbonPoints: number;
// }

// // Component for displaying each ride card
// function RideCard({ ride, type, carbonPoints }: RideCardProps) {
//   const relativeTime = formatDistanceToNow(
//     new Date(ride.startingTime),
//     { addSuffix: true }
//   );
  
//   // Type guard to check if it's a created ride
//   const isCreatedRide = (ride: CreatedRide | RideBase): ride is CreatedRide => {
//     return 'maxPassengers' in ride && 'bookings' in ride;
//   };
  
//   // Get the number of passengers for created rides
//   const passengerCount = isCreatedRide(ride) 
//     ? ride.bookings.filter(booking => booking.status === "Confirmed").length 
//     : 0;
    
  
//   return (
//     <Card className="mb-4 bg-[#1A3C34] text-white border-none hover:bg-[#25493f] transition-colors">
//       <CardHeader className="pb-2">
//         <div className="flex justify-between items-start">
//           <div className="flex flex-col">
//             <CardTitle className="text-white flex items-center gap-2">
//               {type === "created" ? (
//                 <ArrowUp className="h-4 w-4 text-emerald-400" />
//               ) : (
//                 <ArrowDown className="h-4 w-4 text-emerald-400" />
//               )}
//               <span className="text-lg">{ride.from} → {ride.to}</span>
//             </CardTitle>
//             <CardDescription className="text-gray-400 mt-1">
//               {relativeTime}
//             </CardDescription>
//           </div>
//           <Badge className={`${getRideStatusColor(ride.status)}`}>
//             {ride.status}
//           </Badge>
//         </div>
//       </CardHeader>
//       <CardContent className="pb-4">
//         <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
//           <div className="flex items-center text-gray-300">
//             <Calendar className="h-4 w-4 mr-2 text-emerald-400" />
//             <span>{ride.date}</span>
//           </div>
//           <div className="flex items-center text-gray-300">
//             <Clock className="h-4 w-4 mr-2 text-emerald-400" />
//             <span>{ride.time} IST</span>
//           </div>
//           <div className="flex items-center text-gray-300">
//             <MapPin className="h-4 w-4 mr-2 text-emerald-400" />
//             <span>From: {ride.from}</span>
//           </div>
//           <div className="flex items-center text-gray-300">
//             <MapPin className="h-4 w-4 mr-2 text-emerald-400" />
//             <span>To: {ride.to}</span>
//           </div>
//           {type === "created" && (
//             <div className="flex items-center text-gray-300">
//               <Users className="h-4 w-4 mr-2 text-emerald-400" />
//               <span>{passengerCount} Passengers</span>
//             </div>
//           )}
//           <div className="flex items-center text-gray-300">
//             <Leaf className="h-4 w-4 mr-2 text-emerald-400" />
//             <span>
//               {type === "created" ? "Earned: " : "Used: "}
//               <span className="text-emerald-400 font-medium">{carbonPoints} CP</span>
//             </span>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// // Loading skeleton for ride cards
// function RideCardSkeleton() {
//   return (
//     <Card className="mb-4 bg-[#1A3C34] border-none">
//       <CardHeader className="pb-2">
//         <div className="flex justify-between">
//           <Skeleton className="h-6 w-48 bg-white/10" />
//           <Skeleton className="h-6 w-20 bg-white/10" />
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="grid grid-cols-2 gap-4">
//           <Skeleton className="h-4 w-24 bg-white/10" />
//           <Skeleton className="h-4 w-24 bg-white/10" />
//           <Skeleton className="h-4 w-full bg-white/10" />
//           <Skeleton className="h-4 w-full bg-white/10" />
//           <Skeleton className="h-4 w-32 bg-white/10" />
//           <Skeleton className="h-4 w-20 bg-white/10" />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// export default function RideHistoryPage() {
//   const router = useRouter();
//   const { userData, isLoading } = useAuth();
//   const [activeTab, setActiveTab] = useState<"created" | "booked">("created");
//   const [visibleCreatedRides, setVisibleCreatedRides] = useState<number>(20);
//   const [visibleBookedRides, setVisibleBookedRides] = useState<number>(20);
//   const [hasMoreCreated, setHasMoreCreated] = useState<boolean>(true);
//   const [hasMoreBooked, setHasMoreBooked] = useState<boolean>(true);
//   const [loadingMore, setLoadingMore] = useState<boolean>(false);
  
//   const observerRef = useRef<IntersectionObserver | null>(null);
  
//   const loadMoreRides = useCallback(() => {
//     setLoadingMore(true);
//     // Simulate loading delay
//     setTimeout(() => {
//       if (activeTab === "created") {
//         const newVisibleCount = visibleCreatedRides + 10;
//         setVisibleCreatedRides(newVisibleCount);
        
//         // Check if we've reached the end of the list
//         if (userData?.createdRides && newVisibleCount >= userData.createdRides.length) {
//           setHasMoreCreated(false);
//         }
//       } else {
//         const newVisibleCount = visibleBookedRides + 10;
//         setVisibleBookedRides(newVisibleCount);
        
//         // Check if we've reached the end of the list
//         if (userData?.bookedRides && newVisibleCount >= userData.bookedRides.length) {
//           setHasMoreBooked(false);
//         }
//       }
//       setLoadingMore(false);
//     }, 1000);
//   }, [activeTab, visibleCreatedRides, visibleBookedRides, userData?.createdRides, userData?.bookedRides]);

//   const loadMoreTriggerRef = useCallback((node: HTMLDivElement) => {
//     if (loadingMore) return;
    
//     if (observerRef.current) {
//       observerRef.current.disconnect();
//     }
    
//     observerRef.current = new IntersectionObserver(entries => {
//       const [entry] = entries;
//       if (entry.isIntersecting) {
//         if (activeTab === "created" && hasMoreCreated) {
//           loadMoreRides();
//         } else if (activeTab === "booked" && hasMoreBooked) {
//           loadMoreRides();
//         }
//       }
//     });
    
//     if (node) {
//       observerRef.current.observe(node);
//     }
//   }, [activeTab, loadingMore, hasMoreCreated, hasMoreBooked, loadMoreRides]);

//   // Reset visible counts when switching tabs
//   useEffect(() => {
//     setVisibleCreatedRides(20);
//     setVisibleBookedRides(20);
//     setHasMoreCreated(true);
//     setHasMoreBooked(true);
//   }, [activeTab]);

//   // Show loading skeleton if data is loading
//   if (isLoading) {
//     return (
//       <div className="p-4 pb-20 max-w-2xl mx-auto">
//         <div className="flex items-center justify-between mb-4">
//           <Button 
//             variant="ghost" 
//             size="sm" 
//             className="text-white hover:bg-white/10 -ml-2 hover:cursor-pointer"
//             onClick={() => router.push("/dashboard")}
//           >
//             <HomeIcon className="h-5 w-5 mr-1"/>
//             Home
//           </Button>
//           <h1 className="text-2xl font-semibold text-white">Ride History</h1>
//           <div className="w-20"></div>
//         </div>
        
//         <Tabs defaultValue="created" className="w-full">
//           <TabsList className="grid w-full grid-cols-2 bg-[#1A3C34]">
//             <TabsTrigger 
//               value="created" 
//               className="data-[state=active]:bg-emerald-600"
//             >
//               Created Rides
//             </TabsTrigger>
//             <TabsTrigger 
//               value="booked" 
//               className="data-[state=active]:bg-emerald-600"
//             >
//               Booked Rides
//             </TabsTrigger>
//           </TabsList>
          
//           <TabsContent value="created" className="mt-4">
//             {Array(5).fill(0).map((_, i) => (
//               <RideCardSkeleton key={`created-skeleton-${i}`} />
//             ))}
//           </TabsContent>
          
//           <TabsContent value="booked" className="mt-4">
//             {Array(5).fill(0).map((_, i) => (
//               <RideCardSkeleton key={`booked-skeleton-${i}`} />
//             ))}
//           </TabsContent>
//         </Tabs>
//       </div>
//     );
//   }

//   // Calculate if there are rides to display
//   const hasCreatedRides = userData?.createdRides && userData.createdRides.length > 0;
//   const hasBookedRides = userData?.bookedRides && userData.bookedRides.length > 0;
  
//   // Ensure we have the correct types for rides
//   const createdRides = (userData?.createdRides || []) as CreatedRide[];
//   const bookedRides = (userData?.bookedRides || []) as RideBase[];

//   return (
//     <div className="p-4 pb-20 max-w-2xl mx-auto">
//       <div className="flex items-center justify-between mb-4">
//         <Button 
//           variant="ghost" 
//           size="sm" 
//           className="text-white hover:bg-white/10 -ml-2 hover:cursor-pointer"
//           onClick={() => router.push("/dashboard")}
//         >
//           <HomeIcon className="h-5 w-5 mr-1"/>
//           Home
//         </Button>
//         <h1 className="text-2xl font-semibold text-white">Ride History</h1>
//         <div className="w-20"></div>
//       </div>
      
//       <Tabs 
//         defaultValue="created" 
//         className="w-full"
//         onValueChange={(value) => setActiveTab(value as "created" | "booked")}
//       >
//         <TabsList className="grid w-full grid-cols-2 bg-[#1A3C34]">
//           <TabsTrigger 
//             value="created" 
//             className="data-[state=active]:bg-emerald-600"
//           >
//             Created Rides
//           </TabsTrigger>
//           <TabsTrigger 
//             value="booked" 
//             className="data-[state=active]:bg-emerald-600"
//           >
//             Booked Rides
//           </TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="created" className="mt-4">
//           {hasCreatedRides ? (
//             <>
//               {createdRides.slice(0, visibleCreatedRides).map((ride) => (
//                 <RideCard 
//                   key={ride.id} 
//                   ride={ride} 
//                   type="created"
//                   carbonPoints={10} // Placeholder, replace with actual points if available
//                 />
//               ))}
              
//               {/* Loading more trigger element */}
//               {hasMoreCreated && (
//                 <div ref={loadMoreTriggerRef} className="h-10 flex justify-center items-center">
//                   {loadingMore && activeTab === "created" && (
//                     <div className="text-emerald-400 flex items-center">
//                       <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Loading more...
//                     </div>
//                   )}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="py-10 text-center bg-black/20 rounded-lg border border-dashed border-gray-700">
//               <Calendar className="h-12 w-12 mx-auto text-gray-500 mb-2" />
//               <p className="text-lg font-medium text-white">No Created Rides</p>
//               <p className="text-sm text-gray-400 mt-1">You haven&apos;t created any rides yet</p>
//               <Button 
//                 className="mt-4 bg-emerald-600 hover:bg-emerald-700"
//                 onClick={() => router.push("/create-ride")}
//               >
//                 Create a Ride
//               </Button>
//             </div>
//           )}
//         </TabsContent>
        
//         <TabsContent value="booked" className="mt-4">
//           {hasBookedRides ? (
//             <>
//               {bookedRides.slice(0, visibleBookedRides).map((ride) => (
//                 <RideCard 
//                   key={ride.id} 
//                   ride={ride} 
//                   type="booked"
//                   carbonPoints={5} // Placeholder, replace with actual points if available
//                 />
//               ))}
              
//               {/* Loading more trigger element */}
//               {hasMoreBooked && (
//                 <div ref={loadMoreTriggerRef} className="h-10 flex justify-center items-center">
//                   {loadingMore && activeTab === "booked" && (
//                     <div className="text-emerald-400 flex items-center">
//                       <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Loading more...
//                     </div>
//                   )}
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="py-10 text-center bg-black/20 rounded-lg border border-dashed border-gray-700">
//               <Calendar className="h-12 w-12 mx-auto text-gray-500 mb-2" />
//               <p className="text-lg font-medium text-white">No Booked Rides</p>
//               <p className="text-sm text-gray-400 mt-1">You haven&apos;t booked any rides yet</p>
//               <Button 
//                 className="mt-4 bg-emerald-600 hover:bg-emerald-700"
//                 onClick={() => router.push("/book-ride")}
//               >
//                 Book a Ride
//               </Button>
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// } 

const RideHistoryPage = () => {
  return (
    <div>Not implemented yet</div>
  );
}

export default RideHistoryPage;