
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
 * Update an existing vehicle
 */
export async function updateVehicle(
    {
        id,
        userId,
        type,
        vehicleNumber,
        model,
    } : {
        id           : string,
        userId       : string,
        type         : VehicleType,
        vehicleNumber: string,
        model        : string
    }
) {
  try {

    // Validate input
    const validatedData = vehicleSchema.parse({
        type,
        vehicleNumber,
        model,
    });
    
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
        throw new Error( 'Vehicle not found or you do not have permission to update it' );
    }
    
    // Update vehicle
    const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
            type         : type,
            vehicleNumber: vehicleNumber,
            model        : model,
        },
    });

    return vehicle;
    
    } catch ( error: any ) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message);
        }
        logger.error( `Error updating profile: ${error.stack}`);
        throw new Error( 'Failed to update vehicle' );
    }
}