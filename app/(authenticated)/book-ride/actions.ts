"use server";

import { auth } from "@/lib/auth/auth";
import { getUserById } from "@/lib/user/getUser";

/**
 * Get the carbon point of the user
 * @returns 
 */
export async function getCarbonPoint(): Promise<number> {

    // Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error('You must be signed in to view your carbon point');
    }

    // Get user's data
    const user = await getUserById(session.user.id);

    return user.carbonPoints;
}