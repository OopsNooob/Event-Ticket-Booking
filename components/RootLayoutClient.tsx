"use client";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import SyncUserWithConvex from "@/components/SyncUserWithConvex";
import Header from "@/components/Header";
import { ReactNode } from "react";

export default function RootLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <ClerkProvider>
        <Header />
        <SyncUserWithConvex />
        {children}
        <Toaster />
      </ClerkProvider>
    </ConvexClientProvider>
  );
}
