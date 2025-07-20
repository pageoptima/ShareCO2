// app/api/messages/send/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { insertMessage } from '@/lib/message/messageServices';
import logger from '@/config/logger';
import ably from '@/services/ably';

export async function POST(req: Request) {  // rideId, content

    // Auth check and get the user id.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    // Parse & validate payload
    const { rideId, content } = await req.json();
    if (!rideId || !content) {
        return NextResponse.json(
            { error: 'Missing rideId or text' },
            { status: 400 }
        );
    }

    // Insert messages
    let message = null;
    try {
        message = await insertMessage({ senderId: userId, rideId: rideId, content: content });
    } catch (error) {
        logger.error('GET /api/messages/send error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    // Broadcast message to ride chanal
    await ably
        .channels.get(`ride:${rideId}`)
        .publish( 'message', {
            id       : message.id,
            senderId : message.userId,
            content  : message.content,
            createdAt: message.createdAt.toISOString(),
        });

    return NextResponse.json({ success: true }, { status: 201 });
}
