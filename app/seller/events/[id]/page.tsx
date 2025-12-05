"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { ArrowLeft, Calendar, MapPin, Ticket, DollarSign, Users, Edit } from "lucide-react";
import { useStorageUrl } from "@/lib/utils";
import RoleGuard from "@/components/RoleGuard";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as Id<"events">;

  const event = useQuery(api.events.getEventById, { eventId });
  const tickets = useQuery(api.tickets.getValidTicketsForEvent, { eventId });
  
  const imageUrl = useStorageUrl(event?.imageStorageId);

  if (!event || !tickets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Calculate tickets sold from actual tickets
  const ticketsSold = tickets.length;
  const revenue = ticketsSold * event.price;
  const attendees = tickets.filter((t) => t.status === "used").length;

  return (
    <RoleGuard allowedRole="organizer">
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back and Edit buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/seller/events")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
          
          <button
            onClick={() => router.push(`/seller/events/${eventId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Event
          </button>
        </div>

        {/* Event Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            {/* Event Image */}
            <div className="md:w-1/3">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={event.name}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Calendar className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="md:w-2/3 p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.name}</h1>
              <p className="text-gray-600 mb-6">{event.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-semibold">£{event.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Ticket className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="font-semibold">{event.totalTickets}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tickets Sold</p>
                <p className="text-3xl font-bold text-gray-900">
                  {ticketsSold}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  of {event.totalTickets} total
                </p>
              </div>
              <Ticket className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Revenue</p>
                <p className="text-3xl font-bold text-green-600">£{revenue.toFixed(0)}</p>
                <p className="text-sm text-gray-500 mt-1">Total earnings</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Attendees</p>
                <p className="text-3xl font-bold text-purple-600">
                  {attendees}
                </p>
                <p className="text-sm text-gray-500 mt-1">Checked in</p>
              </div>
              <Users className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Ticket Buyers List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Ticket Buyers</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No tickets sold yet
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm">
                          {ticket._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(ticket.purchasedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === "valid"
                              ? "bg-green-100 text-green-800"
                              : ticket.status === "used"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ticket.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        £{event.price.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </RoleGuard>
  );
}