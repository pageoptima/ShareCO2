"use server";

import { auth } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';
import { createVehicle as createVehicleDb } from '@/lib/vehicle/createVehicle';
import { updateVehicle as updateVehicleDb } from '@/lib/vehicle/updateVehicle';
import { deleteVehicle as deleteVehicleDb } from '@/lib/vehicle/deleteVehicle';
import { getUserVehicles as getUserVehiclesDb } from '@/lib/vehicle/retriveVehicle';

import { PublicVehicle, PublicVehicleArgs } from './types';

/**
 * Add a new vehicle for the authenticated user
 */
export async function addVehicle(data: PublicVehicleArgs) {

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error( 'You must be signed in to add a vehicle' );
    }

    const vehicle = await createVehicleDb({
        userId: session.user.id,
        vehicleNumber: data.vehicleNumber,
        type: data.type,
        model: data.model as string,
    })

    revalidatePath('/profile');
    return vehicle;
}

/**
 * Update an existing vehicle
 */
export async function updateVehicle(id: string, data: PublicVehicleArgs) {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error( 'You must be signed in to update a vehicle' );
    }

    // Update vehicle
    const vehicle = await updateVehicleDb({
        id,
        userId: session.user.id,
        vehicleNumber: data.vehicleNumber,
        type: data.type,
        model: data.model as string,
    });

    revalidatePath('/profile');
    return vehicle;
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string) {
    try {

        // Get authenticated user
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "You must be signed in to delete a vehicle" };
        }

        // Check if vehicle exists and belongs to user
        const success = await deleteVehicleDb({
            id,
            userId: session.user.id,
        })

        revalidatePath('/profile');
        return { success: success };

    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Get all vehicles for the authenticated user
 */
export async function getUserVehicles(): Promise<PublicVehicle[]> {
    
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error( 'You must be signed in to view your vehicles' );
    }

    // Get user's vehicles
    const vehicles = await getUserVehiclesDb(session.user.id);

    return vehicles as PublicVehicle[];
} 