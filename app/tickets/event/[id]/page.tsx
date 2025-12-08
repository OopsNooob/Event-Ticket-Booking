"use client";

import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { redirect, useRouter } from "next/navigation";
import { Ticket, Calendar, MapPin, ArrowLeft, Download } from "lucide-react";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useStorageUrl } from "@/lib/utils";
import QRCode from "qrcode";
import Spinner from "@/components/Spinner";
import RoleGuard from "@/components/RoleGuard";
import { QRCodeSVG } from "qrcode.react";

export default function EventTicketsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as Id<"events">;

  const tickets = useQuery(
    api.events.getUserTickets,
    user ? { userId: user.id } : "skip"
  );

  const event = useQuery(
    api.events.getById,
    eventId ? { eventId } : "skip"
  );

  // Always call useStorageUrl hook, even if event is not loaded yet
  const imageUrl = useStorageUrl(event?.imageStorageId);

  if (isLoaded && !user) {
    redirect("/sign-in");
  }

  if (!tickets || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Filter tickets for this event only
  const eventTickets = tickets.filter(
    (ticket) => ticket && ticket.eventId === eventId && ticket.event
  );

  const isEventEnded = event.eventDate ? new Date(event.eventDate) < new Date() : false;

  if (eventTickets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Tickets Found
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have any tickets for this event
          </p>
          <button
            onClick={() => router.push("/tickets")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  const downloadTicket = async (ticket: any) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Event name
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 32px Arial";
      ctx.fillText(event.name, 50, 70);

      // Event details
      ctx.fillStyle = "#6b7280";
      ctx.font = "20px Arial";
      ctx.fillText(
        `Date: ${new Date(event.eventDate).toLocaleDateString()}`,
        50,
        120
      );
      ctx.fillText(`Location: ${event.location}`, 50, 160);
      ctx.fillText(`Ticket ID: ${ticket._id.slice(-8).toUpperCase()}`, 50, 200);

      // Generate QR Code using qrcode library
      const qrDataUrl = await QRCode.toDataURL(ticket._id, {
        width: 500,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Load QR code image and draw it on canvas
      const qrImage = new Image();
      qrImage.src = qrDataUrl;
      
      await new Promise((resolve) => {
        qrImage.onload = () => {
          const qrSize = 500;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 250;
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
          resolve(true);
        };
      });

      // Status badge
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      const badgeY = 800;
      const badgeWidth = 200;
      const badgeHeight = 60;
      const badgeX = canvas.width / 2 - badgeWidth / 2;

      const displayStatus = isEventEnded && ticket.status === "valid" ? "ended" : ticket.status;

      if (displayStatus === "valid") {
        ctx.fillStyle = "#10b981";
      } else if (displayStatus === "used") {
        ctx.fillStyle = "#6b7280";
      } else {
        ctx.fillStyle = "#ef4444";
      }

      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(displayStatus.toUpperCase(), canvas.width / 2, badgeY + 40);

      // Download
      const link = document.createElement("a");
      const eventSlug = event.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const ticketCode = ticket._id.slice(-8).toLowerCase();
      link.download = `ticket-${eventSlug}-${ticketCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading ticket:", error);
    }
  };

  return (
    <RoleGuard allowedRole="user">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.push("/tickets")}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to My Tickets</span>
          </button>

          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="relative h-64 w-full bg-gray-100">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Ticket className="w-24 h-24 text-gray-400" />
                </div>
              )}
              {isEventEnded && (
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-500 text-white">
                    EVENT ENDED
                  </span>
                </div>
              )}
            </div>

            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
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
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Ticket className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Your Tickets</p>
                    <p className="font-semibold text-gray-900">
                      {eventTickets.length} Ticket{eventTickets.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTickets.map((ticket, index) => {
              const displayStatus = isEventEnded && ticket.status === "valid" ? "ended" : ticket.status;

              return (
                <div
                  key={ticket._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Ticket #{index + 1}
                      </h3>
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

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Ticket ID</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {ticket._id.slice(-12).toUpperCase()}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Purchased</p>
                      <p className="text-sm text-gray-900">
                        {new Date(ticket.purchasedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="bg-gray-50 rounded-lg p-4 text-center mb-4">
                      <div
                        data-ticket-id={ticket._id}
                        className="inline-block bg-white p-3 rounded-lg"
                      >
                        <QRCodeSVG
                          value={JSON.stringify({
                            ticketId: ticket._id,
                            eventId: ticket.eventId,
                            userId: ticket.userId,
                          })}
                          size={180}
                          level="H"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Scan at entrance
                      </p>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => downloadTicket(ticket)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Ticket
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
