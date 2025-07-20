"use client";

import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    useState,
    useEffect,
    useRef
} from "react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Send,
    Car,
    User as UserIcon,
    Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { useChannel } from "@ably-labs/react-hooks";
import { utcIsoToLocalDate, utcIsoToLocalTime12 } from "@/utils/time";

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
    };
}

async function fetchMessageHistory(rideId: string): Promise<Message[]> {
    const response = await fetch(`/api/message/${rideId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return response.json();
}

function RideChatModal_(
    {
        isOpen,
        onClose,
        rideId,
        isActive,
    }: {
        isOpen: boolean;
        onClose: () => void;
        rideId: string;
        isActive: boolean;
    }
) {

    // get the user id.
    const session = useSession();
    const userId = session.data?.user?.id;

    const [message, setMessage] = useState('');
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

    if ( isMessageHistoryFetchingError ) {
        console.error(messageHistoryFetchingError)
    }

    useEffect(() => {
        // Scroll to bottom when messages change
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messageHistory]);


    // Mutation funciton for send message
    const { mutateAsync: mutateSendMessage, isPending: isMessageSending } =
        useMutation({
            mutationFn: async ({ rideId, content }: { rideId: string, content: string }) => {
                const response = await fetch('/api/message/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rideId, content }),
                });

                return response.json();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        });

    // Handle sending a message
    const handleSendMessage = async () => {
        if (isMessageSending) { return }
        await mutateSendMessage({ rideId, content: message });
        setMessage('');
    };

    // Check is driver or not:
    const isUserDriver = () => {
        return false;
    }

    useChannel(`ride:${rideId}`, () => {
        refechMessageHistory();
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full min-h-screen h-screen max-h-screen p-0 m-0 overflow-hidden max-w-full border-none bg-[#1A3C34] text-white flex flex-col">
                {/* Header - Fixed */}
                <div className="p-4 border-b border-white/10">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-center text-white">
                            Ride Chat:
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
                    className="flex-1 overflow-y-auto"
                    style={{ height: 'calc(100vh - 152px)' }}
                >
                    {messageHistoryFetching ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                    ) : (
                        <>
                            {/* Messages Section */}
                            <div className="p-4 pb-20 space-y-4">
                                {
                                    messageHistory.length > 0 ?
                                        (
                                            messageHistory.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${msg.user.id === userId ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`flex gap-2 max-w-[80%] ${msg.user.id === userId
                                                            ? 'flex-row-reverse'
                                                            : 'flex-row'
                                                            }`}
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={`https://avatar.vercel.sh/${msg.user.email}`} />
                                                            <AvatarFallback>
                                                                {msg.user.name?.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs text-gray-400">{msg.user.name}</span>
                                                                {isUserDriver() && (
                                                                    <Badge className="text-[0.6rem] py-0 h-4 bg-emerald-600 hover:bg-emerald-600">
                                                                        <Car className="h-2 w-2 mr-1" />
                                                                        Champion
                                                                    </Badge>
                                                                )}
                                                                {!isUserDriver() && (
                                                                    <Badge className="text-[0.6rem] py-0 h-4 bg-blue-600 hover:bg-blue-600">
                                                                        <UserIcon className="h-2 w-2 mr-1" />
                                                                        Rider
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div
                                                                className={`p-3 rounded-lg ${msg.user.id === userId
                                                                    ? 'bg-emerald-700 text-white rounded-tr-none'
                                                                    : 'bg-gray-700 text-white rounded-tl-none'
                                                                    }`}
                                                            >
                                                                <p className="text-sm">{msg.content}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {utcIsoToLocalDate(msg.createdAt)} : {utcIsoToLocalTime12(msg.createdAt)}
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
                                        )
                                }

                                {/* Dummy element to scroll to */}
                                <div ref={bottomRef} />
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
                            // onKeyDown={(e) => e.key === 'Enter' && !isMessageSending && handleSendMessage()}
                            className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                            disabled={!isActive && isMessageSending}
                        />
                        <Button
                            onClick={() => handleSendMessage()}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={isMessageSending}
                        >
                            {isMessageSending ? (
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

export function RideChatModal(
    {
        isOpen,
        onClose,
        rideId,
        isActive,
    }: {
        isOpen: boolean;
        onClose: () => void;
        rideId: string;
        isActive: boolean;
    }
) {
    return (
        <RideChatModal_
            isOpen={isOpen}
            onClose={onClose}
            rideId={rideId}
            isActive={isActive}
        />
    )
}