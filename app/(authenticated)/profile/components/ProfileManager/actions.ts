"use server";

import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/lib/user/getUser";
import { updateProfile } from "@/lib/user/updateProfile";

/**
 * Get the user profile
 */
export async function getUserProfile() {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("You must be logged in to update your profile");
    }

    return await getUserById( session.user.id );
}

/**
 * Update the user profiles
 */
export async function updateUserProfile(
    {
        name,
        gender,
        age,
        phone,
    }: {
        name?: string,
        gender?: "Male" | "Female" | "Other" | "",
        age?: number,
        phone?: string,
    }
) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("You must be logged in to update your profile");
    }

    return await updateProfile({
        id: session.user.id,
        name,
        gender,
        age,
        phone
    });
}