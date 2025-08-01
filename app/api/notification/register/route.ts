import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import ably from '@/services/ably';

export async function POST(req: Request) {

    // Auth check and get the user id.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    // Get the device information from request body
    const {
        deviceId,
        platform,
        formFactor,
        pushRecipient
    } = await req.json();

    if ( !deviceId || !platform || !formFactor || !pushRecipient) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Register the device
    await ably.push.admin.deviceRegistrations.save({
        id        : deviceId,
        platform  : platform,
        formFactor: formFactor,
        push      : {
            recipient: pushRecipient
        },
    });

    // Assign the device id to the channel
    await ably.push.admin.channelSubscriptions.save({
        deviceId: deviceId,
        channel : `user:${userId}`
    });

    return NextResponse.json({ success: true }, { status: 201 });
}
