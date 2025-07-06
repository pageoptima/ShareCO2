"use client";

import React, { Suspense, ReactNode, JSX } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/app/_components/layout/BottomNav";
import { UserMenu } from "@/app/_components/layout/UserMenu";
import { DisclaimerModal } from "@/app/_components/modals/DisclaimerModal";

// Loading placeholder for UX
function LoadingScreen(): JSX.Element {
  return (
    <div className="min-h-screen bg-emerald-900 bg-radial from-emerald-700 to-black to-90% p-4 flex flex-col space-y-4">
      <Skeleton className="h-8 w-60 bg-white/10 rounded-md" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-lg" />
    </div>
  );
}

// Auth check and protected layout
interface AuthenticatedContentProps {
  children: ReactNode;
}

function AuthenticatedContent({ children }: AuthenticatedContentProps): JSX.Element {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-emerald-900 bg-radial from-emerald-700 to-black to-90%">
      <header className="fixed top-0 right-0 z-50 p-4">
        <UserMenu />
      </header>
      <DisclaimerModal/>
      {children}
      {session && <BottomNav />}
    </div>
  );
}

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps): JSX.Element {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Suspense>
  );
}
