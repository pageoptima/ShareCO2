import { prisma } from '@/config/prisma';
import { Location } from '@prisma/client';

// Get all locations from the database
export async function getLocations(): Promise<Location[]> {
  const locations = await prisma.location.findMany({
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      distanceFromOrg: true,
      isOrganization: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });
  return locations;
}