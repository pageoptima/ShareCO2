import { NextResponse } from "next/server";
import logger from "@/config/logger";
import { getUserByEmail } from "@/lib/user/userServices";

const MART_SECRET_KEY = process.env.MART_SECRET_KEY;

/**
 * GET /api/sso?email=user@example.com
 * Requires: Authorization: Bearer <signed-token>
 */
export async function GET(req: Request) {
    try {

        // Check if mart secret key is present or not
        if ( ! MART_SECRET_KEY) {
            return NextResponse.json(
                { error: 'SSO secret key not configured' },
                { status: 500 }
            );
        }

        // Verify Authorization header
        const authHeader = req.headers.get( 'authorization' );
        if ( !authHeader?.startsWith( 'Bearer ' )) {
            return NextResponse.json(
                { error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        // Verify secret key
        const secret = authHeader.split(' ')[1];
        if ( secret !== MART_SECRET_KEY ) {
            return NextResponse.json(
                { error: 'Invalid secret key' },
                { status: 403 }
            );
        }

        const { email } = await req.json();

        // Varify param
        if (!email) {
            return NextResponse.json(
                { error: "Missing email parameter" },
                { status: 400 }
            );
        }

        // Replace with your actual DB lookup
        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id         : user.id,
                email      : user.email,
                phone      : user.phone,
                name       : user.name ?? '',
                carbonpoint: user.Wallet?.spendableBalance ?? 0,
            },
        });

    } catch (error) {
        logger.error( 'GET /api/mart/user error:', error );
        return NextResponse.json(
            { error: 'Unable to process request' },
            { status: 500 }
        );
    }
}
