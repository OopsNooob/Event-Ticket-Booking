"use client";

import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import Spinner from "./Spinner";

interface TicketCardProps {
  ticket: Doc<"tickets"> & {
    event: Doc<"events"> | null;
  };
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Early return if ticket is undefined
  if (!ticket) {
    return <Spinner />;
  }

  const ticketQuery = useQuery(api.tickets.getTicketWithDetails, {
    ticketId: ticket._id,
  });

  // Early return with proper null checks
  if (!ticketQuery) return <Spinner />;
  if (!ticketQuery.event) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Event information not available</p>
      </div>
    );
  }

  // Now TypeScript knows ticketQuery.event is not null
  const event = ticketQuery.event;
  const isPastEvent = event.eventDate < Date.now();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      canvas.width = 800;
      canvas.height = 1000;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add ticket info
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 32px Arial";
      ctx.fillText(event.name, 50, 80);

      ctx.font = "20px Arial";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(
        `Date: ${new Date(event.eventDate).toLocaleDateString()}`,
        50,
        130
      );
      ctx.fillText(`Location: ${event.location}`, 50, 170);
      ctx.fillText(
        `Ticket ID: ${ticket._id.slice(-8).toUpperCase()}`,
        50,
        210
      );

      // Get QR code SVG
      const qrElement = document.querySelector(
        `[data-ticket-id="${ticket._id}"] svg`
      ) as SVGElement;

      if (qrElement) {
        const svgData = new XMLSerializer().serializeToString(qrElement);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const qrSize = 400;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 300;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

          // Add status badge
          ctx.fillStyle =
            ticket.status === "valid"
              ? "#10b981"
              : ticket.status === "used"
              ? "#6b7280"
              : "#ef4444";
          ctx.fillRect(50, 800, 200, 60);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 24px Arial";
          ctx.fillText(ticket.status.toUpperCase(), 70, 840);

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ticket-${event.name
                .replace(/\s+/g, "-")
                .toLowerCase()}-${ticket._id.slice(-8)}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
            setIsSaving(false);
          });

          URL.revokeObjectURL(url);
        };

        img.src = url;
      } else {
        throw new Error("QR code not found");
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
      alert("Failed to save ticket");
      setIsSaving(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-shadow mx-auto max-w-md w-full"
      data-ticket-id={ticket._id}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h3 className="text-2xl font-bold text-center">{event.name}</h3>
        <p className="text-blue-100 mt-1 text-center">
          {new Date(event.eventDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Ticket Details */}
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-semibold text-gray-900 text-right">
              {event.location}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-semibold text-gray-900">
              ${ticket.amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket ID:</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              {ticket._id.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                ticket.status === "valid"
                  ? isPastEvent
                    ? "bg-gray-100 text-gray-800"
                    : "bg-green-100 text-green-800"
                  : ticket.status === "used"
                  ? "bg-gray-100 text-gray-800"
                  : ticket.status === "refunded"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {ticket.status === "valid" && isPastEvent
                ? "ENDED"
                : ticket.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center my-6 bg-gray-50 p-6 rounded-lg">
          <QRCodeSVG
            value={JSON.stringify({
              ticketId: ticket._id,
              eventId: ticket.eventId,
              userId: ticket.userId,
            })}
            size={200}
            level="H"
            includeMargin
          />
        </div>

        {/* Save Button - Centered */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {isSaving ? "Saving..." : "Save Ticket"}
        </button>

        {/* Instructions */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Show this QR code at the event entrance for verification
        </p>
      </div>
    </div>
  );
}
