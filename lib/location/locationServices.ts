import { prisma } from '@/config/prisma';
import { Location } from '@prisma/client';

// Get all locations from the database
export async function getLocations(): Promise<Location[]> {
  const locations = await prisma.location.findMany({
    orderBy: {
      name: 'asc',
    },
  });
  return locations;
}