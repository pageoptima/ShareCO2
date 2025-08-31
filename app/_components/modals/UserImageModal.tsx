import React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface UserImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  userName: string;
}

export const UserImageModal = ({ isOpen, onClose, imageUrl, userName }: UserImageModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-4 bg-gray-800/90 backdrop-blur-sm border border-white/10 rounded-full max-w-[70vw] max-h-[70vh] md:max-w-[400px] md:max-h-[400px] aspect-square flex flex-col justify-center items-center [&>button]:text-green-500 [&>button]:cursor-pointer">
        <DialogTitle className="sr-only">{`${userName}'s profile image`}</DialogTitle>
        <DialogDescription className="sr-only">This modal displays the profile image of the user.</DialogDescription>
        <div className="relative w-full h-full rounded-full ring-2 ring-white/20">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${userName}'s profile`}
              width={360} // Adjusted for modal padding and smaller size
              height={360} // Adjusted to maintain square aspect ratio
              className="w-full h-full object-cover rounded-full"
              sizes="(max-width: 768px) 70vw, 360px" // Adjusted to match modal dimensions
              priority={false} // Lazy load since this is in a modal
            />
          ) : (
            <div className="w-full h-full bg-emerald-800 text-white text-4xl flex justify-center items-center rounded-full">
              {userName?.[0] || "U"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};