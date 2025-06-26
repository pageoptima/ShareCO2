"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Session } from "next-auth";

const topUpSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  phoneNumber: z.string().min(10).max(10),
});

/**
 * Submit a top-up request for carbon points
 */
export async function requestTopUp(input: {
  amount: number;
  phoneNumber: string;
}) {
  const validation = topUpSchema.safeParse(input);
  
  if (!validation.success) {
    return { error: "Invalid input data" };
  }
  
  const session = (await auth()) as Session | null;
  
  if (!session?.user?.email) {
    return { error: "Not authenticated" };
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  
  if (!user) {
    return { error: "User not found" };
  }
  
  const { amount, phoneNumber } = validation.data;
  
  await prisma.topUpRequest.create({
    data: {
      amount,
      phoneNumber,
      status: "PENDING",
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });
  
  revalidatePath("/dashboard");
  return { success: true, message: "Top-up request submitted successfully" };
} 