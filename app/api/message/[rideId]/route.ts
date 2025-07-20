import logger from '@/config/logger';
import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth/auth";
import { getMessagesByRide } from '@/lib/message/messageServices';

export async function GET(
    _: unknown,
    context: { params: Promise<{ rideId: string }> }
) {
    // Auth check and get the user id.
    const session = await auth();
    if ( !session?.user?.id ) {
        return NextResponse.json( { error: 'Not authenticated' }, { status: 401 } );
    }
    const userId = session.user.id;

    // Validate rideId param
    const { rideId } = await context.params;
    if (!rideId) {
        return NextResponse.json({ error: 'Missing rideId' }, { status: 400 });
    }

    // Fetch messages
    try {
        const messages = await getMessagesByRide({ userId, rideId });
        return NextResponse.json( messages );
    } catch (error) {
        logger.error('GET /api/messages/[rideId] error:', error);
        return NextResponse.json({ error: ( error as Error).message }, { status: 500 });
    }
}
