"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  History,
  Wallet,
  CreditCard,
  HelpCircle, // Imported Bell icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Add types for user with isAdmin
interface ExtendedUser {
  id: string;
  email: string;
  isAdmin?: boolean;
  name?: string;
  image?: string;
}

export function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  if (!session?.user) return null;

  // Type assertion for session user
  const user = session.user as ExtendedUser;

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      localStorage.removeItem("isProfileCompleted");
      toast.success("Logged out successfully");

      // Add a small delay before redirecting
      setTimeout(() => {
        router.push("/");
      }, 100);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to log out";
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };


  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="rounded-full p-0 w-10 h-10">
            <Avatar className="h-10 w-10 border-2 border-emerald-600">
              <AvatarImage
                src={`https://avatar.vercel.sh/${session.user.email}`}
                alt={session.user.email || ""}
              />
              <AvatarFallback className="bg-emerald-800 text-white">
                {session.user.email
                  ? session.user.email.substring(0, 2).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-[#1A3C34] text-white border-none [&>button]:cursor-pointer">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://avatar.vercel.sh/${session.user.email}`}
                  alt={session.user.email || ""}
                />
                <AvatarFallback className="bg-emerald-800 text-white">
                  {session.user.email
                    ? session.user.email.substring(0, 2).toUpperCase()
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {session.user.name || session.user.email?.split("@")[0]}
                </span>
                <span className="text-xs text-gray-400">
                  {session.user.email}
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 cursor-pointer"
              onClick={() => handleNavigate("/profile")}
            >
              <User className="mr-2 h-5 w-5" />
              My Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 cursor-pointer"
              onClick={() => handleNavigate("/ride-history")}
            >
              <History className="mr-2 h-5 w-5" />
              Ride History
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 cursor-pointer"
              onClick={() => handleNavigate("/wallet")}
            >
              <Wallet className="mr-2 h-5 w-5" /> Wallet
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 cursor-pointer"
              onClick={() => handleNavigate("/support")}
            >
              <HelpCircle className="mr-2 h-5 w-5" /> Support
            </Button>

            {/* Admin-only menu item for Recharge Requests */}
            {user.isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
                onClick={() => handleNavigate("/admin/recharge-requests")}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Recharge Requests
              </Button>
            )}

            <hr className="border-white/10 my-4" />
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 hover:text-red-400 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Log Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </>
  );
}