import { NextResponse } from "next/server";
import jwt from "jsonwebtoken"
import logger from "@/config/logger";
import { auth } from "@/lib/auth/auth";

const MART_SECRET_KEY = process.env.MART_SECRET_KEY;
const MART_SERVER_URL = process.env.MART_SERVER_URL;

export async function GET() {
    try {
        // Authentication check
        const session = await auth();
        if (!session?.user?.id || !session?.user?.email) {
            return NextResponse.redirect(`${MART_SERVER_URL}/sso?error=${ encodeURIComponent( 'Not authenticated' )}`);
        }

        if (!MART_SECRET_KEY) {
            return NextResponse.redirect(`${MART_SERVER_URL}/sso?error=${ encodeURIComponent( 'Unable to generate sso token' )}`);
        }

        // Get user information
        const user = {
            id   : session.user.id,
            email: session.user.email,
            name : session.user.name ?? "",
        };

        // Generate short lived JWT token
        const token = jwt.sign(
            {
                sub  : user.id,
                email: user.email,
                name : user.name,
            },
            MART_SECRET_KEY,
            { expiresIn: "60s" }
        );

        // Redirect to WordPress SSO handler
        return NextResponse.redirect(`${MART_SERVER_URL}/sso?token=${token}`);

    } catch (error) {
        logger.error("GET /api/sso error:", error);
        return NextResponse.redirect(`${MART_SERVER_URL}/sso?error=${ encodeURIComponent( 'Unable to generate SSO token' )}`);
    }
}
