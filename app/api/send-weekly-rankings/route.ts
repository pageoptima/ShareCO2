import { weeklyRankingsEmail } from "@/app/_components/emailTemplates/emailTemplates";
import logger from "@/config/logger";
import {
    generateLifetimeUserRankings,
    generateWeeklyDriverRankings,
    generateWeeklyRiderRankings,
    getAdminEmails,
} from "@/lib/rankings/rankingService";
import { mailSender } from "@/services/mailSender";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Check for Authorization header
        const authHeader = request.headers.get("Authorization");
        const expectedToken = process.env.CRON_SECRET;

        if (!expectedToken) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Generate CSV buffers
        const [driverCsvBuffer, riderCsvBuffer, lifetimeCsvBuffer] =
            await Promise.all([
                generateWeeklyDriverRankings(),
                generateWeeklyRiderRankings(),
                generateLifetimeUserRankings(),
            ]);

        // Get admin emails
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) {
            return NextResponse.json(
                { message: "No admin users found" },
                { status: 400 }
            );
        }

        // Email content
        const subject = "Weekly Rankings Report";
        const html = weeklyRankingsEmail();

        // Prepare attachments
        const attachments = [
            {
                filename: "weekly_driver_rankings.csv",
                content: driverCsvBuffer,
            },
            { filename: "weekly_rider_rankings.csv", content: riderCsvBuffer },
            {
                filename: "lifetime_user_rankings.csv",
                content: lifetimeCsvBuffer,
            },
        ];

        // Send email to each admin using mailSender
        const sendPromises = adminEmails.map(async (email) => {
            await mailSender(email, subject, html, attachments);
        });

        await Promise.all(sendPromises);

        return NextResponse.json(
            { message: "Rankings email sent successfully" },
            { status: 200 }
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        logger.error("Error in send-weekly-rankings:", errorMessage);
        return NextResponse.json(
            { error: "Failed to send rankings email" },
            { status: 500 }
        );
    }
}
