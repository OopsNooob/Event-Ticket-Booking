"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Spinner from "./Spinner";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: "user" | "organizer";
  onRoleMismatch?: () => void; // Callback for role mismatch
}

export default function RoleGuard({ children, allowedRole, onRoleMismatch }: RoleGuardProps) {
  const { user, isLoaded } = useUser();

  const userRole = useQuery(
    api.users.getUserRole,
    user?.id ? { userId: user.id } : "skip"
  );

  // Run the callback after render when mismatch is detected
  useEffect(() => {
    if (!isLoaded || !user || userRole === undefined) return;

    if (userRole !== allowedRole) {
      // Call callback after render, avoiding setState-in-render error
      onRoleMismatch?.();
    }
  }, [isLoaded, user, userRole, allowedRole, onRoleMismatch]);

  // Show a loading spinner while the user or role is being loaded
  if (!isLoaded || userRole === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // If mismatch, don't render children (parent callback was already triggered by effect)
  if (user && userRole !== allowedRole) {
    return null;
  }

  // Render children if the role matches
  return <>{children}</>;
}
