"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useState, useEffect } from "react";

let convex: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient {
  if (!convex) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables."
      );
    }

    convex = new ConvexReactClient(convexUrl);
  }

  return convex;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={getConvexClient()}>
      {children}
    </ConvexProvider>
  );
}
