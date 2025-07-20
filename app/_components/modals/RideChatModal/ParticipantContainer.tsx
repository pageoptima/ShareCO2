import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Car, UserIcon } from 'lucide-react';

interface Participant {
    name: string,
    email: string,
    isDriver: boolean,
}

const ParticipantContainer = () => {
    
    const participants: Participant[] = [];

    return (
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
    )
}

export default ParticipantContainer;