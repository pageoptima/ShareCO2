import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { User } from "@prisma/client";
import { z } from "zod";
import { uploadImageToS3, getProfileImageUrl, deleteS3Object } from "../aws/aws-s3-utils";

// Validate the inputs
const userProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  gender: z.enum(["Male", "Female", "Other", ""], {
    required_error: "Gender is required",
  }),
  age: z
    .number()
    .min(18, { message: "You must be at least 18 years old" })
    .max(100),
  phone: z
    .string()
    .regex(/^\d{10}$/, {
      message: "Invalid phone number format",
    }),
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

    // Determine if profile is completed
    const isProfileCompleted = Boolean(name && gender && age && phone);

    // Update the user profile
    await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        gender: gender,
        age: age,
        phone: phone,
        isProfileCompleted,
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
 * Update user profile image by uploading to AWS S3 and saving S3 key to Prisma
 * @param {string} id - User ID
 * @param {Buffer} imageBuffer - Binary data of the image
 * @param {string} mimeType - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<boolean>} - True if successful
 */
export async function updateProfileImage({
  id,
  imageBuffer,
  mimeType,
}: {
  id: string;
  imageBuffer: Buffer;
  mimeType: string;
}) {
  try {
    // Fetch user from Prisma to get username and existing imageKey
    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true, imageKey: true },
    });

    if (!user || !user.name) {
      throw new Error("User not found or username not set");
    }

    // Delete old image from S3 if it exists
    if (user.imageKey) {
      await deleteS3Object(user.imageKey);
    }

    // Upload image to S3 and get the S3 key
    const imageKey = await uploadImageToS3(imageBuffer, user.name, mimeType, id);

    // Update Prisma user with the S3 key
    await prisma.user.update({
      where: { id },
      data: {
        imageKey, // Store the S3 key
      },
    });

    return true;
  } catch (error) {
    logger.error(`Error updating profile image: ${error}`);
    throw error;
  }
}


/**
 * Get a user by id with pre-signed image URL
 * @param id - User ID
 * @returns {Promise<User & { imageUrl: string | null }>} - User object with pre-signed image URL
 */
export async function getUserById(id: string): Promise<User & { imageUrl: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate pre-signed URL if imageKey exists
  const imageUrl = user.imageKey ? await getProfileImageUrl(user.imageKey) : null;

  return {
    ...user,
    imageUrl, // Add pre-signed URL to the response
  };
}


/**
 * Get all users from the database
 * @returns Array of users with id and name
 * @throws Error if query fails
 */
export async function getAllUsers(): Promise<{ id: string; name: string | null }[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return users;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[ScheduleService] Error fetching all users: ${errorMessage}`, { error });
    throw new Error("Failed to fetch users");
  }
}