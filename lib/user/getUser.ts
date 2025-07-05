import { prisma } from "@/config/prisma";
import { CompleteUserType } from "./types";
import { User } from "@prisma/client";

/**
 * Get a user by id
 * @param email 
 * @returns
 */
export async function getUserById( id: string ): Promise<User> {
    const user = await prisma.user.findUnique({
        where: { id: id },
    });

    if ( ! user ) {
        throw new Error( 'User not found' );
    }

    return user;
}

/**
 * Get a user by eamil
 * @param email 
 * @returns
 */
export async function getUserByEmail( email: string ): Promise<CompleteUserType> {

    const user = await prisma.user.findUnique({
        where: { email: email },
        include: {
            transactions: {
                orderBy: { createdAt: "desc" },
                take: 20,
            },
            createdRides: {
                orderBy: { createdAt: "desc" },
                include: {
                    bookings: {
                        include: {
                            user: {
                                select: { email: true },
                            },
                        },
                    },
                },
            },
            bookedRides: {
                orderBy: { createdAt: "desc" },
                include: {
                    ride: true,
                },
            },
            vehicles: true,
        },
    });

    if ( ! user ) {
        throw new Error( 'User not found' );
    }

    return user;
}
