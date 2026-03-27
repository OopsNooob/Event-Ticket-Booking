"use client";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import SyncUserWithConvex from "@/components/SyncUserWithConvex";
import Header from "@/components/Header";
import { ReactNode, Suspense } from "react";

export default function RootLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <ClerkProvider>
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <Suspense fallback={null}>
          <SyncUserWithConvex />
        </Suspense>
        {children}
        <Toaster />
      </ClerkProvider>
    </ConvexClientProvider>
  );
}
