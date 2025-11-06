"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

export default function PurchaseSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") as Id<"events"> | null;

  const event = useQuery(
    api.events.getById,
    eventId ? { eventId } : "skip"
  );

  useEffect(() => {
    if (!eventId) {
      router.push("/");
    }
  }, [eventId, router]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Purchase Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your ticket for <span className="font-semibold">{event.name}</span> has been confirmed.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Check your email for ticket details and QR code.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/tickets")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              View My Tickets
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
