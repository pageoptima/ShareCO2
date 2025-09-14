import { supportTicketEmail } from "@/app/_components/emailTemplates/emailTemplates";
import logger from "@/config/logger";
import { getUserById } from "@/lib/user/userServices";
import { mailSender } from "@/services/mailSender";
import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";


export async function POST(req: NextRequest) {
    let userId: string | undefined;
    try {
        // Parse the request body
        const body = await req.json();
        userId = body.userId;
        const { message } = body;

        if (!message || !userId) {
            return NextResponse.json(
                { message: "Missing required fields: message and userId" },
                { status: 400 }
            );
        }

        // Sanitize message
        const sanitizedMessage = sanitizeHtml(message, {
            allowedTags: [], // Disallow all HTML tags
            allowedAttributes: {},
        });

        // Fetch user details
        const user = await getUserById(userId);
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Prepare email details
        const email = process.env.SUPPORT_EMAIL || "sourav@pageoptima.com";
        const subject = `Support Ticket from User ${userId}`;
        const html = supportTicketEmail(
            userId,
            user.name,
            user.email,
            user.phone,
            sanitizedMessage
        );

        // Send email
        await mailSender(email, subject, html);

        // Return success response
        return NextResponse.json(
            { message: "Support ticket submitted successfully" },
            { status: 200 }
        );
    } catch (error) {
        logger.error("Error in /api/support:", {
            error: error instanceof Error ? error.message : "Unknown error",
            userId: userId || "Unknown",
        });
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to process support ticket",
            },
            { status: 500 }
        );
    }
}
