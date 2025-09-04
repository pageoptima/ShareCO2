import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Car, UserIcon } from "lucide-react";
import { UserImageModal } from "@/app/_components/modals/UserImageModal";

interface Participant {
  id: string;
  name: string;
  email: string;
  isDriver: boolean;
  imageUrl: string | null;
}

async function fetchParticipants(rideId: string): Promise<Participant[]> {
  const response = await fetch(`/api/message/participants/${rideId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch participants");
  }
  return response.json();
}

const ParticipantContainer = ({ rideId }: { rideId: string }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  const {
    data: participants = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["participants", rideId],
    queryFn: () => fetchParticipants(rideId),
  });

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

  if (isLoading) {
    return (
      <div className="border-b border-white/10 p-4">
        <p className="text-xs text-gray-400 pb-1">Participants</p>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-b border-white/10 p-4">
        <p className="text-xs text-gray-400 pb-1">Participants</p>
        <p className="text-xs text-red-400">
          Error: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-white/10 p-4">
        <p className="text-xs text-gray-400 pb-1">Participants</p>
        <div className="flex flex-wrap gap-2">
          {participants.length > 0 ? (
            participants.map((participant) => (
              <div
                key={participant.id} // Use id instead of index for unique key
                className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full"
              >
                <Avatar
                  className="h-5 w-5 cursor-pointer"
                  onClick={() =>
                    handleOpenImageModal(
                      participant.imageUrl,
                      participant.name || participant.email || (participant.isDriver ? "Champion" : "Rider")
                    )
                  }
                >
                  <AvatarImage
                    src={participant.imageUrl || undefined} // Use imageUrl if available, fallback to Vercel avatar
                    alt={participant.name || participant.email || (participant.isDriver ? "Champion" : "Rider")}
                  />
                  <AvatarFallback className={`${participant.isDriver ? "bg-emerald-800" : "bg-blue-800"} text-white text-xs`}>
                    {participant.name?.[0] || participant.email?.[0] || (participant.isDriver ? "C" : "R")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{participant.name || participant.email.split("@")[0]}</span>
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
            ))
          ) : (
            <p className="text-xs text-gray-400">No participants found</p>
          )}
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
    </>
  );
};

export default ParticipantContainer;