"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Car, User as UserIcon, Users } from "lucide-react";
import { configureAbly } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRideChat, Ride } from "@/lib/hooks/useRideChat";
import formatTime from "@/lib/formatTime";

// Configure Ably with client ID
if (typeof window !== 'undefined') {
  configureAbly({
    key: process.env.NEXT_PUBLIC_ABLY_API_KEY || '',
    clientId: `user-${Math.random().toString(36).substring(2, 10)}`,
  });
}

interface RideChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
}

export function RideChatModal({ isOpen, onClose, ride }: RideChatModalProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [showParticipants, setShowParticipants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    participants,
    sendMessage,
    isChatAvailable
  } = useRideChat(ride);

  // Check if chat is available
  useEffect(() => {
    if (isOpen && !isChatAvailable) {
      toast.info("Chat not available yet", { 
        description: "Chat will be available 30 minutes before the ride starts." 
      });
      onClose();
    }
  }, [isOpen, isChatAvailable, onClose]);

  // Scroll to the bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !session?.user?.email || isSending) return;
    
    try {
      setIsSending(true);
      const success = await sendMessage(message);
      if (success) {
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full min-h-screen h-screen max-h-screen p-0 m-0 overflow-hidden max-w-full border-none bg-[#1A3C34] text-white flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-white/10">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-center text-white">
              Ride Chat: {ride.from} → {ride.to}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-300 hover:text-blue-200 hover:bg-blue-900/20"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="h-4 w-4 mr-1" />
                {showParticipants ? 'Hide Participants' : 'Show Participants'}
              </Button>
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Main content - Scrollable */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto" 
          style={{ height: 'calc(100vh - 152px)' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {/* Participants Section */}
              {showParticipants && participants.length > 0 && (
                <div className="border-b border-white/10 p-4">
                  <p className="text-xs text-gray-400 pb-1">Participants</p>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={`https://avatar.vercel.sh/${participant.email}`} />
                          <AvatarFallback>
                            {participant.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">
                          {participant.email.split('@')[0]}
                        </span>
                        {participant.isDriver ? (
                          <Badge className="text-[0.6rem] py-0 h-4 bg-emerald-600 hover:bg-emerald-600">
                            <Car className="h-2 w-2 mr-1" />
                            Champion
                          </Badge>
                        ) : (
                          <Badge className="text-[0.6rem] py-0 h-4 bg-blue-600 hover:bg-blue-600">
                            <UserIcon className="h-2 w-2 mr-1" />
                            Rider
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Messages Section */}
              <div className="p-4 pb-20 space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.sender.email === session?.user?.email ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`flex gap-2 max-w-[80%] ${
                          msg.sender.email === session?.user?.email 
                            ? 'flex-row-reverse' 
                            : 'flex-row'
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${msg.sender.email}`} />
                          <AvatarFallback>
                            {msg.sender.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">{msg.sender.name}</span>
                            {msg.sender.isDriver && (
                              <Badge className="text-[0.6rem] py-0 h-4 bg-emerald-600 hover:bg-emerald-600">
                                <Car className="h-2 w-2 mr-1" />
                                Champion
                              </Badge>
                            )}
                            {!msg.sender.isDriver && (
                              <Badge className="text-[0.6rem] py-0 h-4 bg-blue-600 hover:bg-blue-600">
                                <UserIcon className="h-2 w-2 mr-1" />
                                Rider
                              </Badge>
                            )}
                          </div>
                          
                          <div 
                            className={`p-3 rounded-lg ${
                              msg.sender.email === session?.user?.email 
                                ? 'bg-emerald-700 text-white rounded-tr-none' 
                                : 'bg-gray-700 text-white rounded-tl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(new Date(msg.timestamp))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center py-10">
                    <p className="text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">Be the first to start the conversation</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
        
        {/* Footer - Fixed */}
        <div className="p-4 border-t border-white/10 bg-[#1A3C34] w-full" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
              className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isSending}
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSending}
            >
              {isSending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 