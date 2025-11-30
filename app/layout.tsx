import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <DeploymentBanner />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
        <FeedbackButton />
      </body>
    </html>
  );
}
