"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Spinner from "./Spinner";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: "user" | "organizer";
}

export default function RoleGuard({ children, allowedRole }: RoleGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const userRole = useQuery(
    api.users.getUserRole,
    user?.id ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && !user) {
      // Chưa đăng nhập -> redirect về trang chủ
      router.push("/");
      return;
    }

    if (isLoaded && user && userRole !== undefined) {
      // Đã load xong và có role nhưng không đúng
      if (userRole !== allowedRole) {
        if (allowedRole === "organizer") {
          // Nếu không phải organizer nhưng truy cập trang seller
          router.push("/");
        } else {
          // Nếu không phải user nhưng truy cập trang user
          router.push("/seller/dashboard");
        }
      }
    }
  }, [isLoaded, user, userRole, allowedRole, router]);

  // Đang loading
  if (!isLoaded || userRole === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Sai role
  if (userRole !== allowedRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Đúng role -> render children
  return <>{children}</>;
}
