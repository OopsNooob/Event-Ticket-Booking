"use server";

import { sendTicketEmail, sendMultipleTicketsEmail } from "@/lib/email";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function sendTicketEmailAction(ticketId: Id<"tickets">) {
  console.log("📧 Starting email send action for ticket:", ticketId);
  
  const convex = getConvexClient();

  try {
    // Get ticket details
    console.log("Fetching ticket details...");
    const ticket = await convex.query(api.tickets.getTicketWithDetails, {
      ticketId,
    });

    console.log("Ticket details:", ticket);

    if (!ticket || !ticket.event) {
      console.error("❌ Ticket or event not found");
      throw new Error("Ticket or event not found");
    }

    // Get user details
    console.log("Fetching user details for userId:", ticket.userId);
    const user = await convex.query(api.users.getUserById, {
      userId: ticket.userId,
    });

    console.log("User details:", user);

    if (!user || !user.email) {
      console.error("❌ User email not found");
      throw new Error("User email not found");
    }

    console.log("📧 Sending email to:", user.email);

    // Generate QR code as data URL
    const QRCode = require("qrcode");
    const qrCodeDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        ticketId: ticket._id,
        eventId: ticket.eventId,
        userId: ticket.userId,
      }),
      {
        width: 500,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }
    );

    console.log("✅ QR code generated");

    // Send email
    const result = await sendTicketEmail({
      to: user.email,
      ticketId: ticket._id,
      eventName: ticket.event.name,
      eventDate: ticket.event.eventDate,
      eventLocation: ticket.event.location,
      qrCodeDataUrl,
    });

    console.log("📧 Email send result:", result);

    return result;
  } catch (error) {
    console.error("❌ Error sending ticket email:", error);
    return { success: false, error };
  }
}

export async function sendMultipleTicketsEmailAction(ticketIds: Id<"tickets">[]) {
  console.log(`📧 Starting email send action for ${ticketIds.length} ticket(s)`);
  
  const convex = getConvexClient();

  try {
    // Get all ticket details
    console.log("Fetching ticket details...");
    const ticketPromises = ticketIds.map(ticketId =>
      convex.query(api.tickets.getTicketWithDetails, { ticketId })
    );
    const ticketsData = await Promise.all(ticketPromises);

    console.log("Tickets data:", ticketsData);

    // Validate all tickets exist and belong to same event and user
    if (ticketsData.some(t => !t || !t.event)) {
      console.error("❌ Some tickets or events not found");
      throw new Error("Some tickets or events not found");
    }

    const firstTicket = ticketsData[0];
    const eventId = firstTicket!.eventId;
    const userId = firstTicket!.userId;

    // Verify all tickets are for same event and user
    if (ticketsData.some(t => t!.eventId !== eventId || t!.userId !== userId)) {
      console.error("❌ Tickets belong to different events or users");
      throw new Error("Tickets must belong to same event and user");
    }

    // Get user details
    console.log("Fetching user details for userId:", userId);
    const user = await convex.query(api.users.getUserById, { userId });

    console.log("User details:", user);

    if (!user || !user.email) {
      console.error("❌ User email not found");
      throw new Error("User email not found");
    }

    console.log("📧 Generating QR codes for", ticketIds.length, "tickets");

    // Generate QR codes for all tickets
    const QRCode = require("qrcode");
    const ticketsWithQR = await Promise.all(
      ticketsData.map(async (ticket) => {
        const qrCodeDataUrl = await QRCode.toDataURL(
          JSON.stringify({
            ticketId: ticket!._id,
            eventId: ticket!.eventId,
            userId: ticket!.userId,
          }),
          {
            width: 500,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          }
        );
        return {
          ticketId: ticket!._id,
          qrCodeDataUrl,
        };
      })
    );

    console.log("✅ QR codes generated");
    console.log("📧 Sending email to:", user.email);

    // Send single email with all tickets
    const result = await sendMultipleTicketsEmail({
      to: user.email,
      tickets: ticketsWithQR,
      eventName: firstTicket!.event!.name,
      eventDate: firstTicket!.event!.eventDate,
      eventLocation: firstTicket!.event!.location,
    });

    console.log("📧 Email send result:", result);

    return result;
  } catch (error) {
    console.error("❌ Error sending tickets email:", error);
    return { success: false, error };
  }
}