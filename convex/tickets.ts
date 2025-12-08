import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserTicketForEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    return ticket;
  },
});

// New query to get count of tickets user has for an event
export const getUserTicketCountForEvent = query({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
  },
  handler: async (ctx, { eventId, userId }) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .collect();

    return tickets.length;
  },
});

export const getTicketWithDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) return null;

    const event = await ctx.db.get(ticket.eventId);

    return {
      ...ticket,
      event,
    };
  },
});

export const getValidTicketsForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "valid"), q.eq(q.field("status"), "used"))
      )
      .collect();
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("valid"),
      v.literal("used"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { ticketId, status }) => {
    await ctx.db.patch(ticketId, { status });
  },
});

// Auto-update expired tickets for a specific user
export const updateExpiredTicketsForUser = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    
    // Get all valid tickets for this user - Fixed index name
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "valid"))
      .collect();

    let updatedCount = 0;

    for (const ticket of tickets) {
      // Get event details
      const event = await ctx.db.get(ticket.eventId);
      
      // If event has ended, mark ticket as used
      if (event && event.eventDate < now) {
        await ctx.db.patch(ticket._id, {
          status: "used",
        });
        updatedCount++;
      }
    }

    return { updated: updatedCount };
  },
});

// Auto-update all expired tickets (admin function)
export const updateAllExpiredTickets = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all valid tickets
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.eq(q.field("status"), "valid"))
      .collect();

    let updatedCount = 0;

    for (const ticket of tickets) {
      // Get event details
      const event = await ctx.db.get(ticket.eventId);
      
      // If event has ended, mark ticket as used
      if (event && event.eventDate < now) {
        await ctx.db.patch(ticket._id, {
          status: "used",
        });
        updatedCount++;
      }
    }

    return { updated: updatedCount };
  },
});

// Mark specific ticket as used (for scanning at event)
export const markTicketAsUsed = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.status !== "valid") {
      throw new Error(`Ticket is already ${ticket.status}`);
    }

    await ctx.db.patch(ticketId, {
      status: "used",
    });

    return { success: true };
  },
});
