import logger from "@/config/logger";
import { prisma } from "@/config/prisma";

/**
 * Get all vehicles for the user
 */
export async function getUserVehicles( userId: string ) {
    try {
        // Get user's vehicles
        const vehicles = await prisma.vehicle.findMany({
            where: {
                user: {
                    id: userId,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return vehicles;
    } catch ( error ) {
        logger.error( `Error fetching vehicles: ${error}`);
        throw error;
    }
}
