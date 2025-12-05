"use client";

import SellerDashboard from "@/components/SellerDashboard";
import RoleGuard from "@/components/RoleGuard";

export default function SellerPage() {
  return (
    <RoleGuard allowedRole="organizer">
      <div className="min-h-screen bg-gray-50">
        <SellerDashboard />
      </div>
    </RoleGuard>
  );
}
