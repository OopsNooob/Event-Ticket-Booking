"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables."
      );
    }

    return new ConvexReactClient(convexUrl);
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
