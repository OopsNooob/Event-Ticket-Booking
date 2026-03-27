"use client";

import RoleGuard from "@/components/RoleGuard";
import SellerDashboard from "@/components/SellerDashboard";

// Prevent static prerendering for this page
export const dynamic = "force-dynamic";

export default function SellerDashboardPage() {
  return (
    <RoleGuard allowedRole="organizer">
      <SellerDashboard />
    </RoleGuard>
  );
}