"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cache } from "react";
import { rupeesToCarbonPoints, formatCarbonPointsForDB } from "@/lib/carbonPointsConversion";

// Define interface for admin user
interface AdminUser {
  id: string;
  email: string;
  isAdmin?: boolean;
  name?: string;
}

/**
 * Get all pending recharge requests for admin
 */
export const getRechargeRequests = cache(async () => {
  // Authenticate and check admin status
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  
  // Type assertion for session user
  const user = session.user as AdminUser;
  
  if (!user.isAdmin) {
    throw new Error("Not authorized. Admin access required.");
  }
  
  // Fetch all recharge requests
  const requests = await prisma.topUpRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
  
  // Format the data for the client
  return requests.map(request => ({
    id: request.id,
    userId: request.userId,
    amount: request.amount,
    phoneNumber: request.phoneNumber,
    status: request.status,
    adminComment: request.adminComment,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    user: {
      email: request.user.email,
      name: request.user.name
    }
  }));
});

/**
 * Process a recharge request (approve or reject)
 */
export async function processRechargeRequest(
  requestId: string, 
  status: "APPROVED" | "REJECTED", 
  adminComment?: string
) {
  // Authenticate and check admin status
  const session = await auth();
  
  if (!session?.user) {
    return { error: "Not authenticated" };
  }
  
  // Type assertion for session user
  const user = session.user as AdminUser;
  
  if (!user.isAdmin) {
    return { error: "Not authorized. Admin access required." };
  }
  
  try {
    // Get the recharge request
    const request = await prisma.topUpRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) {
      return { error: "Recharge request not found" };
    }
    
    // Update the request status
    const updatedRequest = await prisma.topUpRequest.update({
      where: { id: requestId },
      data: { 
        status, 
        adminComment: adminComment || null 
      }
    });
    
    // If approved, add carbon points to the user
    if (status === "APPROVED") {
      // Convert rupees to carbon points with precise decimal calculation
      const carbonPointsToAdd = formatCarbonPointsForDB(rupeesToCarbonPoints(request.amount));
      
      // All amounts above ₹0 will result in some carbon points with decimal precision
      if (carbonPointsToAdd <= 0) {
        return { 
          error: `Invalid amount: ₹${request.amount} results in ${carbonPointsToAdd} Carbon Points.` 
        };
      }

      await prisma.user.update({
        where: { id: request.userId },
        data: {
          carbonPoints: {
            increment: carbonPointsToAdd
          },
          transactions: {
            create: {
              type: "Credit",
              amount: carbonPointsToAdd,
              description: `Top up: ₹${request.amount} → ${carbonPointsToAdd.toFixed(6)} CP`
            }
          }
        }
      });
    }
    
    return { success: true, data: updatedRequest };
    
  } catch (error) {
    console.error("Error processing recharge request:", error);
    return { error: "Failed to process recharge request" };
  }
} 