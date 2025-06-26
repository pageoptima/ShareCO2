import { PrismaClient, RideBookingStatus, RideStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Main seed function
 */
async function main() {
  /**
   * Seed locations
   */
  const Locationdata = [
    { name: 'Office',   distanceFromOrg: 0 },
    { name: 'Downtown', distanceFromOrg: 15 },
    { name: 'Airport',  distanceFromOrg: 25 },
    { name: 'Mall',     distanceFromOrg: 8 },
    { name: 'Park',     distanceFromOrg: 5 },
    { name: 'Station',  distanceFromOrg: 12 },
  ];

  const locations = await prisma.$transaction(
    Locationdata.map(location => prisma.location.create({ data: location }))
  );

  /**
   * Create or update a user
   */
  const user = await prisma.user.upsert({
    where: { email: 'shorya@quantumcortex.in' },
    update: {},
    create: {
      email: 'shorya@quantumcortex.in',
      carbonPoints: 500,
    },
  });

  /**
   * Create another user for booking (e.g., a passenger)
   */
  const passenger = await prisma.user.upsert({
    where: { email: 'passenger@example.com' },
    update: {},
    create: {
      email: 'passenger@example.com',
      carbonPoints: 200,
    },
  });

  /**
   * Create sample transactions
   */
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        type: TransactionType.credit,
        amount: 100,
        description: 'Purchased 100 CP',
        createdAt: new Date('2025-03-01'),
      },
      {
        userId: user.id,
        type: TransactionType.debit,
        amount: 50,
        description: 'Used 50 CP for ride',
        createdAt: new Date('2025-03-02'),
      },
      {
        userId: user.id,
        type: TransactionType.credit,
        amount: 30,
        description: 'Earned 30 CP from ride',
        createdAt: new Date('2025-03-03'),
      },
    ],
  });

  /**
   * Create sample rides with startingTime and maxPassengers
   */
  const now             = new Date();
  const oneHourFromNow  = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const rides = await prisma.ride.createMany({
    data: [
      {
        driverId:               user.id,
        startingTime:           twoHoursFromNow, // At least 2 hour from now
        startingLocationId:     locations[1].id,
        destinationLocationId:  locations[0].id,
        status:                 RideStatus.Active,
        carbonCost:             30,
        maxPassengers:          3,
      },
      {
        driverId:               user.id,
        startingTime:           oneHourFromNow, // At least 1 hour from now
        startingLocationId:     locations[5].id,
        destinationLocationId:  locations[0].id,
        status:                 RideStatus.Pending,
        carbonCost:             50,
        maxPassengers:          3,
      },
    ],
  });

  /**
   * Create sample ride bookings
   */
  const activeRide = await prisma.ride.findFirst({
    where: { status: RideStatus.Active, driverId: user.id },
  });
  const pendingRide = await prisma.ride.findFirst({
    where: { status: RideStatus.Pending, driverId: user.id },
  });

  if (activeRide) {
    await prisma.rideBooking.create({
      data: {
        rideId: activeRide.id,
        userId: passenger.id,
        status: RideBookingStatus.Confirmed, // Passenger confirmed for active ride
      },
    });
  }

  if (pendingRide) {
    await prisma.rideBooking.create({
      data: {
        rideId: pendingRide.id,
        userId: passenger.id,
        status: RideBookingStatus.Pending, // Passenger pending for pending ride
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log(`Database seeded successfully!`);
    await prisma.$disconnect();
  });