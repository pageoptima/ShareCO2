import { prisma } from '@/config/prisma';
import logger from '@/config/logger';

/**
 * Delete a vehicle
 */
export async function deleteVehicle({ id, userId } : { id: string, userId: string } ) {
    try {

        // Check if vehicle exists and belongs to user
        const existingVehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                user: {
                    id: userId,
                },
            },
        });

        if ( ! existingVehicle ) {
            throw new Error( 'Vehicle not found or you do not have permission to delete it' );
        }

        // Delete vehicle
        await prisma.vehicle.delete({
            where: { id },
        });

        return true;

    } catch ( error: any ) {
        logger.error( `Error updating profile: ${error.stack}`);
        throw new Error( 'Failed to delete vehicle.' );
    }
}
