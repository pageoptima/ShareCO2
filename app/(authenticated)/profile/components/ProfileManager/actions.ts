"use server";

import { auth } from "@/lib/auth/auth";
import { updateProfile } from "@/lib/user/updateProfile";

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