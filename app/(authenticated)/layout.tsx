"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/app/_components/layout/BottomNav";
import { UserMenu } from "@/app/_components/layout/UserMenu";
import { DisclaimerModal } from "@/app/_components/modals/DisclaimerModal";
import { getUserProfileStatus } from "./_actions/action";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-emerald-900 bg-radial from-emerald-700 to-black to-90% p-4 flex flex-col space-y-4">
      <Skeleton className="h-8 w-60 bg-white/10 rounded-md" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
    </div>
  );
}

interface AuthenticatedContentProps {
  children: React.ReactNode;
}

function AuthenticatedContent({ children }: AuthenticatedContentProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data: profileStatus, isLoading } = useQuery({
    queryKey: ["profile-status"],
    queryFn: getUserProfileStatus,
    enabled: status === "authenticated", // only run when user is authenticated
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && profileStatus && !isLoading) {
      if (!profileStatus.isProfileCompleted) {
        router.replace("/profile");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, profileStatus, isLoading, router]);

  if (status === "loading" || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-emerald-900 bg-radial from-emerald-700 to-black to-90%">
      <header className="fixed top-0 right-0 z-50 p-4">
        <UserMenu />
      </header>
      <DisclaimerModal />
      {children}
      {session && <BottomNav />}
    </div>
  );
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </React.Suspense>
  );
}
