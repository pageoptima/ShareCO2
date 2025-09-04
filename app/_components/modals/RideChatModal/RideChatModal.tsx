"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Send, Car, User as UserIcon, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useChannel, ChannelProvider } from "ably/react";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";
import { UserImageModal } from "@/app/_components/modals/UserImageModal";
import ParticipantContainer from "./ParticipantContainer";

// Interface for message
interface Message {
  id: string;
  rideId: string;
  content: string;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    isDriver: boolean;
    imageUrl: string | null;
  };
}

async function fetchMessageHistory(rideId: string): Promise<Message[]> {
  const response = await fetch(`/api/message/${rideId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  return response.json();
}

function RideChatModal_({
  isOpen,
  onClose,
  rideId,
  isActive,
}: {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  isActive: boolean;
}) {
  const session = useSession();
  const userId = session.data?.user?.id;

  const [message, setMessage] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const {
    data: messageHistory = [],
    isLoading: messageHistoryFetching,
    isError: isMessageHistoryFetchingError,
    error: messageHistoryFetchingError,
    refetch: refechMessageHistory,
  } = useQuery({
    queryKey: ["message-history", rideId],
    queryFn: () => fetchMessageHistory(rideId),
  });

  if (isMessageHistoryFetchingError) {
    console.error(messageHistoryFetchingError);
  }

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageHistory]);

  const { mutateAsync: mutateSendMessage, isPending: isMessageSending } =
    useMutation({
      mutationFn: async ({
        rideId,
        content,
      }: {
        rideId: string;
        content: string;
      }) => {
        const response = await fetch("/api/message/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rideId, content }),
        });

        return response.json();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleSendMessage = async () => {
    if (isMessageSending) return;
    await mutateSendMessage({ rideId, content: message });
    setMessage("");
  };

  /**
   * Handle open user image modal
   */
  const handleOpenImageModal = (imageUrl: string | null, userName: string) => {
    setSelectedUserImage(imageUrl);
    setSelectedUserName(userName);
    setIsImageModalOpen(true);
  };

  /**
   * Handle close user image modal
   */
  const handleCloseImageModal = () => {
    setSelectedUserImage(null);
    setSelectedUserName("");
    setIsImageModalOpen(false);
  };

  useChannel(`ride:${rideId}`, () => {
    refechMessageHistory();
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-[100dvh] max-h-[100dvh] p-0 m-0 overflow-hidden max-w-full border-none bg-[#1A3C34] text-white flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-center text-white">
              Ride Chat
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-300 hover:text-blue-200 hover:bg-blue-900/20 cursor-pointer"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="h-4 w-4 mr-1" />
                {showParticipants ? "Hide Participants" : "Show Participants"}
              </Button>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Participants - Conditionally Rendered */}
        {showParticipants && <ParticipantContainer rideId={rideId} />}

        {/* Main content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {messageHistoryFetching ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {messageHistory.length > 0 ? (
                  messageHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.user.id === userId ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[80%] ${msg.user.id === userId
                          ? "flex-row-reverse"
                          : "flex-row"
                          }`}
                      >
                        <Avatar
                          className="h-8 w-8 cursor-pointer"
                          onClick={() =>
                            handleOpenImageModal(
                              msg.user.imageUrl,
                              msg.user.name || msg.user.email || (msg.user.isDriver ? "Champion" : "Rider")
                            )
                          }
                        >
                          <AvatarImage
                            src={msg.user.imageUrl || undefined}
                            alt={msg.user.name || msg.user.email || (msg.user.isDriver ? "Champion" : "Rider")}
                          />
                          <AvatarFallback
                            className={`${msg.user.isDriver ? "bg-emerald-800" : "bg-blue-800"} text-white text-xs`}
                          >
                            {msg.user.name?.[0] || msg.user.email?.[0] || (msg.user.isDriver ? "C" : "R")}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">
                              {msg.user.name || msg.user.email.split("@")[0]}
                            </span>
                            <Badge
                              className={`text-[0.6rem] py-0 h-4 ${msg.user.isDriver
                                ? "bg-emerald-600 hover:bg-emerald-600"
                                : "bg-blue-600 hover:bg-blue-600"
                                }`}
                            >
                              {msg.user.isDriver ? (
                                <Car className="h-2 w-2 mr-1" />
                              ) : (
                                <UserIcon className="h-2 w-2 mr-1" />
                              )}
                              {msg.user.isDriver ? "Champion" : "Rider"}
                            </Badge>
                          </div>

                          <div
                            className={`p-3 rounded-lg ${msg.user.id === userId
                              ? "bg-emerald-700 text-white rounded-tr-none"
                              : "bg-gray-700 text-white rounded-tl-none"
                              }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {utcIsoToLocalDate(msg.createdAt)} :{" "}
                            {utcIsoToLocalTime12(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center py-10">
                    <p className="text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Be the first to start the conversation
                    </p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 border-t border-white/10 bg-[#1A3C34] shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder={isActive ? "Type your message..." : "Chat is disabled"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && isActive && !isMessageSending && handleSendMessage()
              }
              className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              disabled={!isActive || isMessageSending}
            />
            <Button
              onClick={() => handleSendMessage()}
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              disabled={!isActive || isMessageSending}
            >
              {isMessageSending ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* User Image Modal */}
        {isImageModalOpen && (
          <UserImageModal
            isOpen={isImageModalOpen}
            onClose={handleCloseImageModal}
            imageUrl={selectedUserImage}
            userName={selectedUserName}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RideChatModal({
  isOpen,
  onClose,
  rideId,
  isActive,
}: {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  isActive: boolean;
}) {
  return (
    <ChannelProvider channelName={`ride:${rideId}`}>
      <RideChatModal_
        isOpen={isOpen}
        onClose={onClose}
        rideId={rideId}
        isActive={isActive}
      />
    </ChannelProvider>
  );
}