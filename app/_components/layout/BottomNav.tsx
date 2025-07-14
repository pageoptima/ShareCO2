"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/utils/utils";

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "My Rides", path: "/dashboard" },
    { name: "Book Ride", path: "/book-ride" },
    { name: "Create Ride", path: "/create-ride" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A3C34] text-white flex justify-around p-4 border-t border-gray-700 bg-gradient-to-r from-[#1A3C34] to-black from-30%">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={cn(
            "flex-1 text-center p-2 rounded-lg transition-colors cursor-pointer",
            pathname === item.path ? "bg-[#2E7D32]" : "hover:bg-[#2F4F4F]"
          )}
        >
          {item.name}
        </button>
      ))}
    </nav>
  );
}