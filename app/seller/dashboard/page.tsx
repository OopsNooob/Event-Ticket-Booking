"use client";

import RoleGuard from "@/components/RoleGuard";
import SellerDashboard from "@/components/SellerDashboard";

export default function SellerDashboardPage() {
  return (
    <RoleGuard allowedRole="organizer">
      <SellerDashboard />
    </RoleGuard>
  );
}