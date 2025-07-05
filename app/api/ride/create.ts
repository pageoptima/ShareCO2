import { NextResponse } from 'next/server';
import { createRide } from '@/lib/ride/createRide';
import logger from '@/config/logger';

export default async function handler( request: Request, response: Response ) {
    try {
        const body = await request.json();
        const {
            startingLocationId,
            destinationLocationId,
            startingTime,
            maxPessenger,
            vehicleId,
        } = body;

        // call into your DB logic
        const rideInfo = await createRide(
            startingLocationId,
            destinationLocationId,
            startingTime,
            maxPessenger,
            vehicleId
        );

        return NextResponse.json( rideInfo, { status: 201 } );

    } catch (err: any) {
        logger.error('Error in /api/rides POST:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Unknown error' },
            { status: 500 }
        );
    }
}