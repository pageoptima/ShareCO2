import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { User } from "@prisma/client";
import { z } from "zod";

// Validate the inputs
const userProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  age: z
    .number()
    .int()
    .min(18, { message: "You must be at least 18 years old" })
    .max(100)
    .optional(),
  phone: z
    .string()
    .min(10, { message: "Phone must be at least 10 number" })
    .optional(),
});

/**
 * Update a user
 * @param param0
 * @returns
 */
export async function updateProfile({
  id,
  name,
  gender,
  age,
  phone,
}: {
  id: string;
  name?: string;
  gender?: "Male" | "Female" | "Other" | "";
  age?: number;
  phone?: string;
}) {
  try {
    // Validate inputs
    userProfileSchema.parse({
      name,
      gender,
      age,
      phone,
    });

    // Update the user profile
    await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        gender: gender,
        age: age,
        phone: phone,
      },
    });

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }

    logger.error(`Error updating profile: ${error}`);
    throw error;
  }
}

/**
 * Get a user by id
 * @param email
 * @returns
 */
export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
