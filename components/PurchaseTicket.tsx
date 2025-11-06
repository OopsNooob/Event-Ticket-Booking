"use client";

import { XCircle } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { purchaseTicketAction } from "@/app/actions/purchaseTicket";

export default function PurchaseTicket({ eventId }: { eventId: Id<"events"> }) {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId: user?.id ?? "",
  });

  const releaseTicket = useMutation(api.waitingList.releaseTicket);
  const joinWaitingList = useMutation(api.events.joinWaitingList);

  const handlePurchase = async () => {
    if (!user || !queuePosition) return;

    setIsLoading(true);
    try {
      await purchaseTicketAction({
        eventId,
        waitingListId: queuePosition._id,
        paymentMethod,
      });

      router.push(`/tickets/purchase-success?eventId=${eventId}`);
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to purchase ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!queuePosition) return;

    try {
      await releaseTicket({
        eventId,
        waitingListId: queuePosition._id,
      });
    } catch (error) {
      console.error("Release error:", error);
    }
  };

  const handleJoinQueue = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    try {
      await joinWaitingList({ eventId, userId: user.id });
    } catch (error) {
      console.error("Join queue error:", error);
      alert(error instanceof Error ? error.message : "Failed to join queue");
    }
  };

  useEffect(() => {
    // Add null check for queuePosition
    if (!queuePosition) return;

    const interval = setInterval(() => {
      if (queuePosition.status === "offered" && user) {
        router.refresh();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [queuePosition, user, router]);

  if (!user) {
    return (
      <button
        onClick={() => router.push("/sign-in")}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Sign in to buy tickets
      </button>
    );
  }

  if (!queuePosition || queuePosition.status === "expired") {
    return (
      <button
        onClick={handleJoinQueue}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Join Waiting List
      </button>
    );
  }

  if (queuePosition.status === "offered") {
    // Add null check for offerExpiresAt
    if (!queuePosition.offerExpiresAt) {
      return null;
    }

    const expiresAt = new Date(queuePosition.offerExpiresAt);
    const now = new Date();
    const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div className="bg-white border-2 border-blue-600 rounded-lg p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-semibold text-center">
            Ticket Reserved - Complete Purchase
          </p>
          <p className="text-blue-600 text-sm text-center mt-1">
            Time remaining: {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-gray-700 font-medium">Payment Method</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="card">Credit/Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="ewallet">E-Wallet</option>
              <option value="cash">Cash</option>
            </select>
          </label>

          <button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isLoading ? "Processing..." : "Complete Purchase"}
          </button>

          <button
            onClick={handleRelease}
            className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-red-200 transition"
          >
            <XCircle className="w-5 h-5" />
            Release Ticket
          </button>
        </div>
      </div>
    );
  }

  if (queuePosition.status === "waiting") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-semibold text-center">
          You're in the waiting list
        </p>
        <p className="text-yellow-600 text-sm text-center mt-1">
          Position: #{queuePosition.position}
        </p>
      </div>
    );
  }

  return null;
}
