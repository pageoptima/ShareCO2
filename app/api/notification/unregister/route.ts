import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { getAbly } from '@/services/ably';

export async function POST(req: Request) {

    // Auth check and get the user id.
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the device information from request body
    const { deviceId } = await req.json();

    if ( !deviceId ) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Unegister the device
    const ably = getAbly();
    await ably.push.admin.deviceRegistrations.remove(deviceId);

    return NextResponse.json({ success: true }, { status: 201 });
}
