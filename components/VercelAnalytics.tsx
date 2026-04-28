"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Vercel Analytics & Speed Insights Component
 * 
 * Features:
 * - Analytics: Tracks Web Vitals (CLS, FID, LCP, TTFB, INP)
 * - Speed Insights: Monitors real-world performance metrics
 * 
 * Note: Both components only work in production (when deployed to Vercel)
 */
export function VercelAnalytics() {
  return (
    <>
      {/* Vercel Analytics - Web Vitals tracking */}
      <Analytics />
      
      {/* Vercel Speed Insights - Real-world performance monitoring */}
      <SpeedInsights />
    </>
  );
}
