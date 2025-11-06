"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import TicketCard from "@/components/TicketCard";
import Spinner from "@/components/Spinner";
import { redirect } from "next/navigation";

export default function MyTicketsPage() {
  const { user, isLoaded } = useUser();

  const tickets = useQuery(
    api.events.getUserTickets,
    user ? { userId: user.id } : "skip"
  );

  if (isLoaded && !user) {
    redirect("/sign-in");
  }

  if (!tickets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Filter out any undefined or null tickets
  const validTickets = tickets.filter(
    (ticket) => ticket && ticket._id && ticket.event
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          My Tickets
        </h1>

        {validTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              You don&apos;t have any tickets yet
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {validTickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
