
import { z } from 'zod';
import { prisma } from '@/config/prisma';
import { VehicleType } from '@prisma/client';
import logger from '@/config/logger';

// Vehicle validation schema
const vehicleSchema = z.object({
    type         : z.string().min(1, "Vehicle type is required"),
    vehicleNumber: z.string().min(1, "Vehicle number is required"),
    model        : z.string().optional(),
});

/**
 * Add a new vehicle for the authenticated user
 */
export async function createVehicle(
    {
        userId,
        vehicleNumber,
        type,
        model,
    } : {
        userId: string,
        vehicleNumber: string,
        type: VehicleType,
        model: string,
    }
) {
    try {
        // Validate input
        vehicleSchema.parse({
            vehicleNumber,
            type,
            model,
        });

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error( `User not found` );
        }

        // Create vehicle
        const vehicle = await prisma.vehicle.create({
            data: {
                userId       : user.id,
                type         : type,
                vehicleNumber: vehicleNumber,
                model        : model,
            },
        });

        return vehicle;

    } catch ( error ) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message);
        }
        logger.error( `Error updating profile: ${error}`);
        throw error;
    }
}