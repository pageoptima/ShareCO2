import logger from '@/config/logger';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { getRideParticipants } from '@/lib/message/messageServices';

export async function GET(
  _: unknown,
  context: { params: Promise<{ rideId: string }> }
) {
  // Auth check and get the user id
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Validate rideId param
  const { rideId } = await context.params;
  if (!rideId) {
    return NextResponse.json({ error: 'Missing rideId' }, { status: 400 });
  }

  // Fetch participants
  try {
    const participants = await getRideParticipants(rideId);
    return NextResponse.json(participants);
  } catch (error) {
    logger.error(`GET /api/participants/[${rideId}] error:`, error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}