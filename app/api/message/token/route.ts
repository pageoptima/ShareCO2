import logger from '@/config/logger';
import { NextResponse } from 'next/server';
import { auth } from "@/lib/auth/auth";
import ably from '@/services/ably';

export async function GET() {

    // Auth check and get the user id.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const token = await ably.auth.createTokenRequest({
            clientId: userId,
        });
        return NextResponse.json(token);
    } catch (error) {
        logger.error('GET /api/messages/token error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
