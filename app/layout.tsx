import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { ReactQueryProvider } from "@/app/_components/providers/ReactQueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Share CO2",
  description: "A ride-sharing app to reduce carbon footprints",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A3C34" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="logo.png" />
      </head>
      <body className={inter.className}>
        <ReactQueryProvider>
          <SessionProvider>
            {children}
            <Toaster position="top-center" richColors closeButton={true} />
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}