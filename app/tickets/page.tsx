"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { redirect } from "next/navigation";
import { Ticket, Calendar, MapPin, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { useStorageUrl } from "@/lib/utils";
import Spinner from "@/components/Spinner";

// Component để hiển thị mỗi ticket card với image
function TicketCardWithImage({
  ticket,
  onClick,
}: {
  ticket: any;
  onClick: () => void;
}) {
  const imageUrl = useStorageUrl(ticket.event?.imageStorageId);
  
  // Check if event has ended
  const isEventEnded = ticket.event?.eventDate 
    ? new Date(ticket.event.eventDate) < new Date() 
    : false;
  
  const displayStatus = isEventEnded && ticket.status === "valid" 
    ? "ended" 
    : ticket.status;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden text-left border-2 border-transparent hover:border-blue-500 group"
    >
      {/* Event Image */}
      <div className="relative h-48 w-full bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={ticket.event?.name || "Event"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <Ticket className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              displayStatus === "valid"
                ? "bg-green-500 text-white"
                : displayStatus === "ended"
                ? "bg-red-500 text-white"
                : displayStatus === "used"
                ? "bg-gray-500 text-white"
                : "bg-orange-500 text-white"
            }`}
          >
            {displayStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Ticket Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {ticket.event?.name || "Event"}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {ticket.event?.eventDate
                ? new Date(ticket.event.eventDate).toLocaleDateString("en-US", {
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
              {ticket.event?.location || "Location TBA"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-600" />
            <span className="font-mono text-xs">
              {ticket._id.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* View Details Button */}
        <div className="mt-4 flex items-center justify-between text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
          <span>View Details</span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

export default function MyTicketsPage() {
  const { user, isLoaded } = useUser();

  const tickets = useQuery(
    api.events.getUserTickets,
    user ? { userId: user.id } : "skip"
  );

  const updateExpiredTickets = useMutation(api.tickets.updateExpiredTicketsForUser);

  const [selectedTicketId, setSelectedTicketId] = useState<Id<"tickets"> | null>(
    null
  );

  // Auto-update expired tickets when page loads
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

  // Filter out any undefined or null tickets
  const validTickets = tickets.filter(
    (ticket) => ticket && ticket._id && ticket.event
  );

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

  const selectedTicket = validTickets.find((t) => t._id === selectedTicketId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-gray-600">
            You have {validTickets.length} ticket
            {validTickets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {validTickets.map((ticket) => (
            <TicketCardWithImage
              key={ticket._id}
              ticket={ticket}
              onClick={() => setSelectedTicketId(ticket._id)}
            />
          ))}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && selectedTicketId && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTicketId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white relative">
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

                <h2 className="text-3xl font-bold mb-2">
                  {selectedTicket.event?.name}
                </h2>
                <p className="text-blue-100">
                  {selectedTicket.event?.eventDate
                    ? new Date(selectedTicket.event.eventDate).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "Date TBA"}
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                {/* Event Details */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTicket.event?.location || "TBA"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price:</p>
                    <p className="font-semibold text-gray-900">
                      ${(selectedTicket.event?.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ticket ID:</p>
                    <p className="font-semibold text-gray-900 font-mono text-sm">
                      {selectedTicket._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status:</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedTicket.status === "valid"
                          ? "bg-green-100 text-green-800"
                          : selectedTicket.status === "used"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedTicket.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <div className="inline-block bg-white p-6 rounded-lg shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedTicket._id}`}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Show this QR code at the event entrance for verification
                  </p>
                </div>

                {/* Download Button */}
                <button
                  onClick={async () => {
                    // Create a canvas to draw the ticket
                    const canvas = document.createElement('canvas');
                    canvas.width = 800;
                    canvas.height = 1000;
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) return;

                    // Background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Event Name
                    ctx.fillStyle = '#1f2937';
                    ctx.font = 'bold 32px Arial';
                    ctx.textAlign = 'left';
                    const eventName = selectedTicket.event?.name || 'Event';
                    ctx.fillText(eventName, 50, 70);

                    // Date
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '20px Arial';
                    const dateText = selectedTicket.event?.eventDate
                      ? `Date: ${new Date(selectedTicket.event.eventDate).toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                        })}`
                      : 'Date: TBA';
                    ctx.fillText(dateText, 50, 120);

                    // Location
                    const locationText = `Location: ${selectedTicket.event?.location || 'TBA'}`;
                    ctx.fillText(locationText, 50, 160);

                    // Ticket ID
                    const ticketIdText = `Ticket ID: ${selectedTicket._id.slice(-8).toUpperCase()}`;
                    ctx.fillText(ticketIdText, 50, 200);

                    // Load and draw QR code - FIX HERE
                    const qrImg = new window.Image(); // Use window.Image instead of Image
                    qrImg.crossOrigin = 'anonymous';
                    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${selectedTicket._id}`;
                    
                    qrImg.onload = () => {
                      // Draw QR code centered
                      const qrSize = 500;
                      const qrX = (canvas.width - qrSize) / 2;
                      const qrY = 250;
                      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                      // Status badge
                      const status = selectedTicket.status.toUpperCase();
                      ctx.font = 'bold 28px Arial';
                      ctx.textAlign = 'center';
                      
                      // Badge background
                      const badgeY = 800;
                      const badgeWidth = 200;
                      const badgeHeight = 60;
                      const badgeX = canvas.width / 2 - badgeWidth / 2;
                      
                      if (selectedTicket.status === 'valid') {
                        ctx.fillStyle = '#10b981';
                      } else if (selectedTicket.status === 'used') {
                        ctx.fillStyle = '#6b7280';
                      } else {
                        ctx.fillStyle = '#ef4444';
                      }
                      
                      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
                      
                      // Badge text
                      ctx.fillStyle = '#ffffff';
                      ctx.fillText(status, canvas.width / 2, badgeY + 40);

                      // Download
                      const link = document.createElement('a');
                      // Create filename from event name and ticket ID
                      const eventSlug = selectedTicket.event?.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '') || 'event';
                      const ticketCode = selectedTicket._id.slice(-8).toLowerCase();
                      link.download = `ticket-${eventSlug}-${ticketCode}.png`;
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    };
                  }}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md flex items-center justify-center gap-2"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Save Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}