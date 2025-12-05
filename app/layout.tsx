import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/app/components/Footer";
import DeploymentBanner from "@/app/components/DeploymentBanner";
import FeedbackButton from "@/app/components/FeedbackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Song Pig Listening Rooms",
  description: "Private rooms to A/B your songs with friends. Invite-only. Votes and comments stay private.",
};

// CRITICAL: Fix for iOS/Chrome mobile keyboard causing horizontal float/drift
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content", // Forces page to resize when keyboard opens
};

// Only show deployment banner in non-production environments by default.
// You can force it on in production by setting NEXT_PUBLIC_SHOW_DEPLOYMENT_BANNER="true".
const showDeploymentBanner =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_SHOW_DEPLOYMENT_BANNER === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100dvh',
          overflowX: 'hidden',
          maxWidth: '100vw',
        }}
      >
        {showDeploymentBanner && <DeploymentBanner />}
        <div style={{ flex: 1, overflowX: 'hidden', maxWidth: '100vw' }}>
          {children}
        </div>
        <Footer />
        <FeedbackButton />
      </body>
    </html>
  );
}
