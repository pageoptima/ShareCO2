import { NextResponse } from "next/server";
import { sendPushNotification } from "@/services/ably";
import { getAllUsers } from "@/lib/user/userServices";
import logger from "@/config/logger";

// Message templates
const morningBody = (name: string) =>
    `Hi ${name || "User"}, don't forget to update your ride details “Your travel time to the office is running close”. Have a good one.`;

const eveningBody = (name: string) =>
    `Hi ${name || "User"}, don't forget to update your ride details “Your travel time to the home is running close”. Have a good one.`;

// Shared notification settings
const notificationTitle = "Ride Details Update Reminder";
const eventName = "ride_update_reminder";
const redirectUrl = "/dashboard";

export async function GET(request: Request) {
    // Secure the route with CRON_SECRET
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // morning or evening

    if (!["morning", "evening"].includes(type || "")) {
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    try {
        // Fetch all users using the service
        const users = await getAllUsers();

        // Send notifications concurrently using Promise.all
        const bodyFn = type === "morning" ? morningBody : eveningBody;
        await Promise.all(
            users.map((user) =>
                sendPushNotification({
                    userId: user.id,
                    title: notificationTitle,
                    body: bodyFn(user.name ?? "User"),
                    eventName,
                    redirectUrl,
                })
            )
        );

        logger.info(`[API] ${type} reminders sent successfully to ${users.length} users`);

        return NextResponse.json({
            message: `${type!.charAt(0).toUpperCase() + type!.slice(1)} reminders sent successfully`,
            count: users.length,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`[API] Error sending ${type} reminders: ${errorMessage}`, { error });
        return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
    }
}