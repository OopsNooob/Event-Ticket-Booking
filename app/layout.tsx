import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "leaflet/dist/leaflet.css"; // Add this line
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/toaster";
import SyncUserWithConvex from "@/components/SyncUserWithConvex";
import RootLayoutClient from "@/components/RootLayoutClient";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Event Ticket Booking",
  description: "Book your tickets for the best events",
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
      >
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
