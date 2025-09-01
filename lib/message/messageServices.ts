import logger from "@/config/logger";
import { prisma } from "@/config/prisma";
import { getProfileImageUrl } from "../aws/aws-s3-utils";



// Helper function to get user with pre-signed image URL
const getUserWithImageUrl = async (user: {
  id: string;
  name: string | null;
  email: string;
  imageKey?: string | null;
  imageUrl?: string | null;
  imageUrlExpiresAt?: Date | null;
}) => {
  let imageUrl: string | null = null;

  // Check if imageKey exists
  if (user.imageKey) {
    const now = new Date();
    // Check if stored URL is valid and not expired
    if (user.imageUrl && user.imageUrlExpiresAt && now < user.imageUrlExpiresAt) {
      imageUrl = user.imageUrl;
    } else {
      // Generate new pre-signed URL if expired or missing
      imageUrl = await getProfileImageUrl(user.imageKey);
      const imageUrlExpiresAt = new Date(Date.now() + 604800 * 1000); // 7 days expiration
      // Update Prisma with new URL and expiration
      await prisma.user.update({
        where: { id: user.id },
        data: {
          imageUrl,
          imageUrlExpiresAt,
        },
      });
    }
  }

  return {
    id: user.id,
    name: user.name || "Unknown",
    email: user.email,
    imageUrl, // Add pre-signed URL
  };
};



/**
 * Insert message into database.
 */
export async function insertMessage({
  rideId,
  senderId,
  content,
}: {
  rideId: string;
  senderId: string;
  content: string;
}) {
  try {
    await validateCredentials({ rideId, userId: senderId });

    // Insert message into database.
    const message = await prisma.chatMessage.create({
      data: {
        rideId: rideId,
        userId: senderId,
        content: content,
      },
    });

    return message;
  } catch (error) {
    logger.error(`Error insert message: ${error}`);
    throw error;
  }
}

/**
 * Fetch messages for a ride, including sender info and role (rider or driver), ordered oldest→newest.
 */
export async function getMessagesByRide({
  userId,
  rideId,
}: {
  userId: string;
  rideId: string;
}) {
  await validateCredentials({ rideId, userId });

  // Fetch the ride to get the driverId
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { driverId: true },
  });

  if (!ride) {
    throw new Error("Ride not found");
  }

  // Fetch messages with user info
  const messages = await prisma.chatMessage.findMany({
    where: { rideId },
    include: {
      user: {
        select: { id: true, name: true, email: true, imageKey: true, imageUrl: true, imageUrlExpiresAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Map messages to include isDriver field
  const messagesWithRole = await Promise.all(messages.map(async (message) => {
    const userWithImage = await getUserWithImageUrl(message.user);
    return {
      ...message,
      user: {
        ...userWithImage,
        isDriver: message.user.id === ride.driverId, // true if user is driver, false if rider
      },
    };
  }));

  return messagesWithRole;
}
/**
 * Validate the credential for accessing the chat
 */
async function validateCredentials({
  rideId,
  userId,
}: {
  rideId: string;
  userId: string;
}) {
  let ride = null;
  try {
    // Check ride status
    ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        bookings: {
          where: {
            userId: userId,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Unable to fetch ride: ${error}`);
    throw new Error("Something went wrong. Please try again letter.");
  }

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status === "Cancelled") {
    throw new Error("Ride is cancelled. Chat closed.");
  }

  // Authenticate the user
  let senderIsAuthenticated = false;

  // Check sender is driver
  if (ride.driverId === userId) {
    senderIsAuthenticated = true;
  } else {
    // Check sender is rider
    if (ride.bookings.length > 0) {
      senderIsAuthenticated = true;

      if (
        ride.bookings[0].status === "CancelledDriver" ||
        ride.bookings[0].status === "CancelledUser"
      ) {
        throw new Error("Ride booking is cancelled. chat closed.");
      }
    }
  }

  if (!senderIsAuthenticated) {
    throw new Error("Unauthorized sender");
  }

  return true;
}

/**
 * Get ride participants by ride ID, including pre-signed image URLs
 */
export async function getRideParticipants(rideId: string) {
  try {
    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            imageKey: true, // Include imageKey for URL generation
            imageUrl: true, // Include existing imageUrl
            imageUrlExpiresAt: true, // Include expiration for validation
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageKey: true, // Include imageKey for URL generation
                imageUrl: true, // Include existing imageUrl
                imageUrlExpiresAt: true, // Include expiration for validation
              },
            },
          },
        },
      },
    });

    if (!ride) {
      throw new Error("Ride not found");
    }

    // Collect all users (driver + passengers) into one array
    const allUsers = [
      ride.driver,
      ...ride.bookings.map((booking) => booking.user),
    ];

    // Process all users in parallel, adding isDriver flag
    const participants = await Promise.all(
      allUsers.map(async (user) => {
        const userWithImage = await getUserWithImageUrl({
          id: user.id,
          name: user.name,
          email: user.email,
          imageKey: user.imageKey,
          imageUrl: user.imageUrl,
          imageUrlExpiresAt: user.imageUrlExpiresAt,
        });
        return {
          ...userWithImage,
          isDriver: user.id === ride.driver.id,
        };
      })
    );

    return participants;
  } catch (error) {
    logger.error(`Error fetching participants for ride ID ${rideId}: ${error}`);
    throw error;
  }
}