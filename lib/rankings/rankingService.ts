// app/services/rankingService.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
// import logger from '@/config/logger';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

interface UserRanking {
    name: string | null;
    email: string;
    phone: string | null;
    CEpoints: number;
}

export async function generateWeeklyDriverRankings(folderName: string): Promise<string> {
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const drivers = await prisma.ride.groupBy({
        by: ['driverId'],
        where: {
            startingTime: {
                gte: lastWeekStart,
                lte: lastWeekEnd,
            },
            cePointsEarned: {
                gt: 0,
            },
        },
        _sum: {
            cePointsEarned: true,
        },
        orderBy: {
            _sum: {
                cePointsEarned: 'desc',
            },
        },
    });

    const rankings = await Promise.all(
        drivers.map(async (driver) => {
            const user = await prisma.user.findUnique({
                where: { id: driver.driverId },
                select: { name: true, email: true, phone: true },
            });
            return {
                name: user?.name ?? 'Unknown',
                email: user?.email ?? '',
                phone: user?.phone ?? '',
                CEpoints: driver._sum.cePointsEarned ?? 0,
            };
        })
    );

    return generateCsvFile('weekly_driver_rankings', rankings, folderName);
}

export async function generateWeeklyRiderRankings(folderName: string): Promise<string> {
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const riders = await prisma.rideBooking.groupBy({
        by: ['userId'],
        where: {
            createdAt: {
                gte: lastWeekStart,
                lte: lastWeekEnd,
            },
            cePointsEarned: {
                gt: 0,
            },
        },
        _sum: {
            cePointsEarned: true,
        },
        orderBy: {
            _sum: {
                cePointsEarned: 'desc',
            },
        },
    });

    const rankings = await Promise.all(
        riders.map(async (rider) => {
            const user = await prisma.user.findUnique({
                where: { id: rider.userId },
                select: { name: true, email: true, phone: true },
            });
            return {
                name: user?.name ?? 'Unknown',
                email: user?.email ?? '',
                phone: user?.phone ?? '',
                CEpoints: rider._sum.cePointsEarned ?? 0,
            };
        })
    );

    return generateCsvFile('weekly_rider_rankings', rankings, folderName);
}

export async function generateLifetimeUserRankings(folderName: string): Promise<string> {
    const users = await prisma.user.findMany({
        select: {
            name: true,
            email: true,
            phone: true,
            cePoints: true,
        },
        orderBy: {
            cePoints: 'desc',
        },
    });

    const rankings: UserRanking[] = users.map((user) => ({
        name: user.name ?? 'Unknown',
        email: user.email,
        phone: user.phone ?? '',
        CEpoints: user.cePoints,
    }));

    return generateCsvFile('lifetime_user_rankings', rankings, folderName);
}

async function generateCsvFile(fileName: string, rankings: UserRanking[], folderName: string): Promise<string> {
    const fields = [
        { label: 'Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'PhoneNumber', value: 'phone' },
        { label: 'CEpoints', value: 'CEpoints' },
    ];

    const json2csvParser = new Parser({ fields });
    const csvContent = json2csvParser.parse(rankings);

    const storageDir = path.join(process.cwd(), 'storage', 'rankings', folderName);
    const filePath = path.join(storageDir, `${fileName}.csv`);

    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(filePath, csvContent);
    return filePath;
}

export async function getAdminEmails(): Promise<string[]> {
    const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { email: true },
    });
    return admins.map((admin) => admin.email);
}