"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Spinner from "@/components/Spinner";
import { Calendar, Ticket, DollarSign, Clock } from "lucide-react";
import { useStorageUrl } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface EventListProps {
  userId: string;
  filter: "upcoming" | "past";
  onEventClick: (eventId: Id<"events">) => void;
}

function EventCard({ event, onEventClick }: { event: any; onEventClick: () => void }) {
  const imageUrl = useStorageUrl(event.imageStorageId);
  const now = Date.now();
  const isEnded = event.eventDate < now;

  return (
    <button
      onClick={onEventClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-500 w-full text-left group"
    >
      <div className="flex flex-col md:flex-row">
        {/* Event Image */}
        <div className="relative w-full md:w-64 h-48 bg-gray-100 flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {event.name}
              </h3>
              <p className="text-gray-600">{event.description}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Tickets Sold</p>
                <p className="font-bold text-gray-900">
                  {event.ticketsSold ?? 0}/{event.totalTickets}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="font-bold text-gray-900">
                  £{((event.ticketsSold ?? 0) * event.price).toFixed(0)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Date</p>
                <p className="font-bold text-gray-900">
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <p className={`font-bold ${isEnded ? "text-red-600" : "text-green-600"}`}>
                  {isEnded ? "Ended" : "Active"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function EventList({ userId, filter, onEventClick }: EventListProps) {
  const events = useQuery(api.events.getSellerEventsWithStats, { userId });

  if (!events) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const now = Date.now();
  const filteredEvents = events.filter((event) => {
    if (filter === "upcoming") {
      return event.eventDate >= now;
    } else {
      return event.eventDate < now;
    }
  });

  if (filteredEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No {filter} events
        </h3>
        <p className="text-gray-600">
          {filter === "upcoming"
            ? "Create your first event to get started"
            : "You don't have any past events yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredEvents.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          onEventClick={() => onEventClick(event._id)}
        />
      ))}
    </div>
  );
}