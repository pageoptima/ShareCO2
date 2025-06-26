"use server";

import { prisma } from '@/lib/prisma';
import { cache } from 'react';

interface Location {
  name: string;
}

// Wrap the function with the cache decorator to enable React's automatic caching
export const getLocations = cache(async (): Promise<string[]> => {
  try {
    // Get all locations from the database
    const locations = await prisma.location.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Extract location names
    const locationNames = locations.map((location: Location) => location.name);
    
    return locationNames;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw new Error('Failed to fetch locations');
  }
});