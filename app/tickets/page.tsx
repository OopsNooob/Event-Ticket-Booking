"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { redirect, useRouter } from "next/navigation";
import { Ticket, Calendar, MapPin, ChevronRight, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useStorageUrl } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import RoleGuard from "@/components/RoleGuard";

interface GroupedTickets {
  eventId: Id<"events">;
  event: any;
  tickets: any[];
  validCount: number;
  usedCount: number;
  expiredCount: number;
}

function EventTicketCard({
  group,
  onClick,
}: {
  group: GroupedTickets;
  onClick: () => void;
}) {
  const imageUrl = useStorageUrl(group.event?.imageStorageId);
  const isEventEnded = group.event?.eventDate 
    ? new Date(group.event.eventDate) < new Date() 
    : false;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden text-left border-2 border-transparent hover:border-blue-500 group"
    >
      <div className="relative h-48 w-full bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={group.event?.name || "Event"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <Ticket className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Ticket className="w-4 h-4" />
            <span>{group.tickets.length} Ticket{group.tickets.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {isEventEnded && (
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
              ENDED
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {group.event?.name || "Event"}
        </h3>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {group.event?.eventDate
                ? new Date(group.event.eventDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date TBA"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="truncate">
              {group.event?.location || "Location TBA"}
            </span>
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex gap-3 text-xs">
            {group.validCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">{group.validCount} Valid</span>
              </div>
            )}
            {group.usedCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <span className="text-gray-600">{group.usedCount} Used</span>
              </div>
            )}
            {group.expiredCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-600">{group.expiredCount} Expired</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
          <span>View All Tickets</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

export default function MyTicketsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const tickets = useQuery(
    api.events.getUserTickets,
    user ? { userId: user.id } : "skip"
  );
  const updateExpiredTickets = useMutation(api.tickets.updateExpiredTicketsForUser);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id) {
      updateExpiredTickets({ userId: user.id }).catch((error) => {
        console.error("Failed to update expired tickets:", error);
      });
    }
  }, [user?.id, updateExpiredTickets]);

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

  const validTickets = tickets.filter(
    (ticket) => ticket && ticket._id && ticket.event
  );

  const groupedTicketsMap = new Map<Id<"events">, GroupedTickets>();
  
  validTickets.forEach((ticket) => {
    const eventId = ticket.eventId;
    if (!groupedTicketsMap.has(eventId)) {
      groupedTicketsMap.set(eventId, {
        eventId,
        event: ticket.event,
        tickets: [],
        validCount: 0,
        usedCount: 0,
        expiredCount: 0,
      });
    }
    
    const group = groupedTicketsMap.get(eventId)!;
    group.tickets.push(ticket);
    
    const isEventEnded = ticket.event?.eventDate 
      ? new Date(ticket.event.eventDate) < new Date() 
      : false;
    
    if (ticket.status === "valid") {
      if (isEventEnded) {
        group.expiredCount++;
      } else {
        group.validCount++;
      }
    } else if (ticket.status === "used") {
      group.usedCount++;
    } else {
      group.expiredCount++;
    }
  });

  const groupedTickets = Array.from(groupedTicketsMap.values());

  const filteredGroups = groupedTickets.filter((group) => {
    if (!searchQuery.trim()) return true;
    
    const eventName = group.event?.name?.toLowerCase() || "";
    const location = group.event?.location?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    
    return (
      eventName.includes(query) ||
      location.includes(query)
    );
  });

  if (validTickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Tickets Yet
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't purchased any tickets yet
          </p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Browse Events
          </a>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRole="user">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tickets</h1>
            <p className="text-gray-600">
              You have {validTickets.length} ticket{validTickets.length !== 1 ? "s" : ""} from {groupedTickets.length} event{groupedTickets.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by event name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400 bg-white shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            
            {searchQuery && (
              <p className="mt-3 text-sm text-gray-600">
                Found {filteredGroups.length} event{filteredGroups.length !== 1 ? "s" : ""} matching "{searchQuery}"
              </p>
            )}
          </div>

          {filteredGroups.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-600 mb-4">
                Try searching with different keywords
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          )}

          {filteredGroups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <EventTicketCard
                  key={group.eventId}
                  group={group}
                  onClick={() => router.push(`/tickets/event/${group.eventId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
