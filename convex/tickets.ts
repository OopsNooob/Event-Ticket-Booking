import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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
      .filter((q) => q.eq(q.field("isDeleted"), undefined)) // Filter out soft-deleted
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
      .filter((q) => q.eq(q.field("isDeleted"), undefined)) // Filter out soft-deleted
      .collect();

    return tickets.length;
  },
});

export const getTicketWithDetails = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, { ticketId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket || ticket.isDeleted) return null; // Filter out soft-deleted

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
        q.and(
          q.or(q.eq(q.field("status"), "valid"), q.eq(q.field("status"), "used")),
          q.eq(q.field("isDeleted"), undefined) // Filter out soft-deleted
        )
      )
      .collect();
  },
});

/**
 * Paginated User Tickets Query
 * * Performance: Pagination for Large Datasets (SAD 12.4)
 * Returns user's tickets in pages instead of loading all at once.
 * * Usage: For users with hundreds of tickets
 */
export const getUserTicketsPaginated = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { userId, paginationOpts }) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isDeleted"), undefined))
      .order("desc")
      .paginate(paginationOpts);
  },
});

/**
 * Paginated Event Tickets Query
 * * Performance: Pagination for Large Datasets (SAD 12.4)
 * Returns event's tickets in pages. Critical for events with 100K+ tickets.
 */
export const getEventTicketsPaginated = query({
  args: {
    eventId: v.id("events"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { eventId, paginationOpts }) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("isDeleted"), undefined))
      .order("desc")
      .paginate(paginationOpts);
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

// ==========================================================
// TÍNH NĂNG MỚI THEO ADD.CSV (ID 57 & ID 61)
// ==========================================================
export const deleteTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    organizerId: v.string(), // Cần truyền ID của organizer (người đang thực hiện thao tác xóa) từ Frontend
  },
  handler: async (ctx, { ticketId, organizerId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket || ticket.isDeleted) {
      throw new Error("Ticket not found or already deleted");
    }

    const event = await ctx.db.get(ticket.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // 1. Authorize Access (Kiến trúc ADD ID 61): Xác thực quyền Organizer của event
    if (event.userId !== organizerId) {
      throw new Error("Authorize Access: Bạn không có quyền xóa vé của sự kiện này.");
    }

    // 2. Maintain Dependencies (Kiến trúc ADD ID 57): Bảo vệ dữ liệu ràng buộc
    // Không cho phép xóa vé nếu vé đang có hiệu lực sử dụng hoặc đã dùng
    if (ticket.status === "valid" || ticket.status === "used") {
      throw new Error("Maintain Dependencies: Không thể xóa vé đã có giao dịch mua bán hợp lệ!");
    }

    // 3. Thực hiện Soft Delete
    await ctx.db.patch(ticketId, {
      isDeleted: true,
    });

    return { success: true };
  },
});