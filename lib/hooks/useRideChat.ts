import { useState, useEffect, useCallback } from 'react';
import { useChannel, usePresence } from '@ably-labs/react-hooks';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getRideChannelName, isChatAvailable } from '@/lib/ably';

export interface ChatMessage {
  id: string;
  text: string;
  sender: {
    email: string;
    name: string;
    isDriver: boolean;
  };
  timestamp: number;
}

export interface Participant {
  email: string;
  isDriver: boolean;
}

export interface Ride {
  id: string;
  from: string;
  to: string;
  date: string; 
  status: string;
  time: string;
  startingTime?: string;
}

export function useRideChat(ride: Ride) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [participants, setParticipants] = useState<{email: string, isDriver: boolean}[]>([]);
  
  // Generate a channel name based on ride ID
  const channelName = getRideChannelName(ride.id);
  
  // Initialize Ably channel
  useChannel(channelName, (message) => {
    if (message.name === "chat-message") {
      const receivedMessage = JSON.parse(message.data) as ChatMessage;
      setMessages((prev) => [...prev, receivedMessage]);
    } 
    else if (message.name === "system") {
      const systemMessage = JSON.parse(message.data);
      if (systemMessage.type === "ride-completed") {
        toast.info("Ride Completed", {
          description: systemMessage.message
        });
      }
    }
  });

  // Initialize presence
  const [presenceData, updatePresence] = usePresence(channelName, {
    email: session?.user?.email || 'unknown',
    isDriver: isDriver
  });

  // Update presence when isDriver changes
  useEffect(() => {
    if (session?.user?.email) {
      updatePresence({
        email: session.user.email,
        isDriver: isDriver
      });
    }
  }, [isDriver, session?.user?.email, updatePresence]);

  // Fetch chat history
  const fetchChatHistory = useCallback(async () => {
    if (!ride.id || !session?.user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch existing messages from the database
      const response = await fetch(`/api/chat/history?rideId=${ride.id}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
        setIsDriver(data.isDriver);
      } else {
        toast.error("Error", { description: data.error || "Failed to load chat history" });
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Error", { description: "Failed to load chat history" });
    } finally {
      setIsLoading(false);
    }
  }, [ride.id, session?.user]);

  // Fetch accepted riders and update participants
  const fetchAcceptedRiders = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/participants?rideId=${ride.id}`);
      const data = await response.json();
      
      if (data.success) {
        // Combine accepted riders with current presence data
        const acceptedRiders = data.participants.map((participant: Participant) => ({
          email: participant.email,
          isDriver: participant.isDriver
        }));

        // Update participants state with both accepted riders and current presence
        setParticipants(() => {
          const currentPresence = presenceData.map(p => ({
            email: p.data.email as string,
            isDriver: p.data.isDriver as boolean
          }));

          // Combine and remove duplicates
          const allParticipants = [...acceptedRiders, ...currentPresence];
          return allParticipants.filter((participant, index, self) => 
            index === self.findIndex(p => p.email === participant.email)
          );
        });
      }
    } catch (error) {
      console.error("Failed to fetch accepted riders:", error);
    }
  }, [ride.id, presenceData]);

  // Fetch chat history and accepted riders when component mounts
  useEffect(() => {
    if (ride.id && session?.user) {
      fetchChatHistory();
      fetchAcceptedRiders();
    }
  }, [ride.id, session?.user, fetchChatHistory, fetchAcceptedRiders]);

  // Check if chat is available
  const checkChatAvailability = useCallback(() => {
    if (!ride.startingTime) return false;
    return isChatAvailable(ride.startingTime);
  }, [ride.startingTime]);

  // Send a message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !session?.user?.email) return false;
    
    const userEmail = session.user.email;
    const userName = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: {
        email: userEmail,
        name: userName,
        isDriver: isDriver
      },
      timestamp: Date.now()
    };
    
    try {
      // Save to database and publish via server
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: ride.id,
          message: newMessage
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast.error("Error", { description: data.error || "Failed to send message" });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Error", { description: "Failed to send message" });
      return false;
    }
  }, [ride.id, session?.user?.email, isDriver]);

  return {
    messages,
    isLoading,
    isDriver,
    participants,
    sendMessage,
    isChatAvailable: checkChatAvailability(),
  };
} 