import { configureAbly } from "@ably-labs/react-hooks";

export function getAblyClient() {
  return configureAbly({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY || '',
    clientId: Math.random().toString(36).substring(2, 15),
  });
}

// Check if a chat should be available
export function isChatAvailable(startingTime: string): boolean {
  if (!startingTime) return false;
  
  const rideStartTime = new Date(startingTime);
  const thirtyMinsBefore = new Date(rideStartTime.getTime() - 30 * 60 * 1000);
  const now = new Date();
  
  return now >= thirtyMinsBefore;
}

// Get channel name for a ride
export function getRideChannelName(rideId: string): string {
  return `ride-chat-${rideId}`;
} 