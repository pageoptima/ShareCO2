import { weeklyRankingsEmail } from '@/app/_components/emailTemplates/emailTemplates';
import logger from '@/config/logger';
import { generateLifetimeUserRankings, generateWeeklyDriverRankings, generateWeeklyRiderRankings, getAdminEmails } from '@/lib/rankings/rankingService';
import { mailSender } from '@/services/mailSender';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
    try {
        // Check for Authorization header
        const authHeader = request.headers.get('Authorization');
        const expectedToken = process.env.CRON_SECRET;

        if (!expectedToken) {
            // logger.error('CRON_SECRET environment variable is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
            // logger.warn('Unauthorized access attempt to send-weekly-rankings');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate folder name in weekWW-MMMM-YYYY format (e.g., week36-September-2025)
        const date = new Date();
        const week = String(getISOWeekNumber(date)).padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        const folderName = `week${week}-${month}-${year}`; // e.g., week36-September-2025

        // Generate CSV files with the same folder name
        const [driverCsvPath, riderCsvPath, lifetimeCsvPath] = await Promise.all([
            generateWeeklyDriverRankings(folderName),
            generateWeeklyRiderRankings(folderName),
            generateLifetimeUserRankings(folderName),
        ]);

        // Get admin emails
        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) {
            return NextResponse.json({ message: 'No admin users found' }, { status: 400 });
        }

        // Email content
        const subject = 'Weekly Rankings Report';
        const html = weeklyRankingsEmail();

        // Prepare attachments
        const attachments = [
            { filename: 'weekly_driver_rankings.csv', path: driverCsvPath },
            { filename: 'weekly_rider_rankings.csv', path: riderCsvPath },
            { filename: 'lifetime_user_rankings.csv', path: lifetimeCsvPath },
        ];

        // Send email to each admin using mailSender
        const sendPromises = adminEmails.map(async (email) => {
            await mailSender(email, subject, html, attachments);
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ message: 'Rankings email sent successfully' }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error in send-weekly-rankings:', errorMessage);
        return NextResponse.json({ error: 'Failed to send rankings email' }, { status: 500 });
    }
}

// Helper function to calculate ISO week number
function getISOWeekNumber(date: Date): number {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 + 1) / 7);
}