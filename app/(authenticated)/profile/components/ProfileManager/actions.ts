"use server";

import { auth } from "@/lib/auth/auth";
import { getUserById, updateProfileImage } from "@/lib/user/userServices";
import { updateProfile } from "@/lib/user/userServices";

/**
 * Get the user profile
 */
export async function getUserProfile() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to update your profile");
  }

  const user = await getUserById(session.user.id);
  return user;
}


/**
 * Update the user profiles
 */
export async function updateUserProfile({
  name,
  gender,
  age,
  phone,
}: {
  name?: string;
  gender?: "Male" | "Female" | "Other" | "";
  age?: number;
  phone?: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be logged in to update your profile");
    }

    const capitalizedName = name
      ? name.charAt(0).toUpperCase() + name.slice(1)
      : name;

    const success = await updateProfile({
      id: session.user.id,
      name: capitalizedName,
      gender,
      age,
      phone,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}


/**
 * Update the user profile image
 */
export async function updateUserProfileImage(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("You must be logged in to update your profile image");
    }

    const file = formData.get('profileImage') as File;
    if (!file) {
      throw new Error("No image file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const success = await updateProfileImage({
      id: session.user.id,
      imageBuffer,
      mimeType: file.type,
    });

    return {
      success: success,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}