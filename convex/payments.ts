import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

/**
 * Create a new payment record
 */
export const createPayment = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("payments", {
      eventId: args.eventId,
      userId: args.userId,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      status: "pending",
      createdAt: Date.now(),
    });

    return paymentId;
  },
});

/**
 * Confirm/complete a payment
 */
export const confirmPayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending") {
      throw new Error("Payment is not in pending status");
    }

    await ctx.db.patch(paymentId, {
      status: "completed",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Fail a payment
 */
export const failPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    reason: v.string(),
  },
  handler: async (ctx, { paymentId, reason }) => {
    const payment = await ctx.db.get(paymentId);
    
    if (!payment) {
      throw new Error("Payment not found");
    }

    await ctx.db.patch(paymentId, {
      status: "failed",
      failureReason: reason,
    });

    return { success: true };
  },
});

/**
 * Refund a payment
 */
export const markTicketAsUsed = mutation({
  args: {
    ticketId: v.id("tickets"),
    organizerId: v.string(), // Thêm argument này
  },
  handler: async (ctx, { ticketId, organizerId }) => {
    const ticket = await ctx.db.get(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const event = await ctx.db.get(ticket.eventId);
    // Thêm check quyền sở hữu (Tenant Isolation)
    if (!event || event.userId !== organizerId) {
      throw new Error("Tenant Isolation: Bạn không có quyền quét vé này!");
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
// TÍNH NĂNG MỚI THEO ADD.CSV (ID 59) & ASR
// ==========================================================
/**
 * Process Internal Payment & Create Tickets (ACID Transaction)
 * Đảm bảo Concurrency Control (Chống Race Conditions / Bán lố vé)
 */
export const processInternalPayment = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    quantity: v.number(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const { eventId, userId, quantity, paymentMethod } = args;

    const event = await ctx.db.get(eventId);
    if (!event || event.isDeleted || event.is_cancelled) {
      throw new Error("Sự kiện không tồn tại hoặc đã bị hủy.");
    }

    if (quantity <= 0) {
      throw new Error("Số lượng vé phải lớn hơn 0.");
    }

    const existingTickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const purchasedCount = existingTickets.filter(
      (t) => (t.status === "valid" || t.status === "used") && !t.isDeleted
    ).length;

    // CONCURRENCY CONTROL (ADD ID 59)
    if (purchasedCount + quantity > event.totalTickets) {
      throw new Error("Concurrency Control: Vé đã bán hết hoặc không đủ số lượng bạn yêu cầu, giao dịch bị hủy!");
    }

    const totalAmount = event.price * quantity;
    const paymentId = await ctx.db.insert("payments", {
      eventId,
      userId,
      amount: totalAmount,
      paymentMethod,
      status: "completed",
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    const ticketIds = await Promise.all(
      Array.from({ length: quantity }, async () => {
        return await ctx.db.insert("tickets", {
          eventId,
          userId,
          purchasedAt: Date.now(),
          status: "valid",
          paymentId,
          amount: event.price,
        });
      })
    );

    return { success: true, paymentId, ticketIds };
  },
});

/**
 * Get payment by ID
 */
export const getPaymentById = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, { paymentId }) => {
    return await ctx.db.get(paymentId);
  },
});

/**
 * Get all payments for a user
 */
export const getUserPayments = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const paymentsWithEvents = await Promise.all(
      payments.map(async (payment) => {
        const event = await ctx.db.get(payment.eventId);
        return {
          ...payment,
          event,
        };
      })
    );

    return paymentsWithEvents;
  },
});

/**
 * Paginated User Payments Query
 */
export const getUserPaymentsPaginated = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { userId, paginationOpts }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts);
  },
});

/**
 * Get all payments for an event
 */
export const getEventPayments = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .order("desc")
      .collect();
  },
});

// ==========================================================
// TỐI ƯU HÓA: SERVER-SIDE AGGREGATION (ADD ID 62)
// ==========================================================

/**
 * getSellerStats - Thống kê tổng quan cho Seller
 * Sử dụng vòng lặp tích lũy trên server thay vì tải toàn bộ bản ghi về Client.
 */
export const getSellerStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const eventIds = events.map((e) => e._id);

    // Biến tích lũy (Aggregation variables)
    let totalRevenue = 0;
    let totalRefunded = 0;
    let pendingAmount = 0;
    let completedCount = 0;
    let refundedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let totalPaymentsCount = 0;

    for (const eventId of eventIds) {
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();

      totalPaymentsCount += payments.length;

      for (const p of payments) {
        if (p.status === "completed") {
          totalRevenue += p.amount;
          completedCount += 1;
        } else if (p.status === "refunded") {
          totalRefunded += p.amount;
          refundedCount += 1;
        } else if (p.status === "pending") {
          pendingAmount += p.amount;
          pendingCount += 1;
        } else if (p.status === "failed") {
          failedCount += 1;
        }
      }
    }

    return {
      totalRevenue,
      totalRefunded,
      pendingAmount,
      netRevenue: totalRevenue - totalRefunded,
      completedCount,
      refundedCount,
      pendingCount,
      failedCount,
      totalPayments: totalPaymentsCount,
    };
  },
});

/**
 * getSellerStatsByMonth - Thống kê theo tháng cho Seller
 * Thực hiện lọc và cộng dồn trực tiếp trên server.
 */
export const getSellerStatsByMonth = query({
  args: { 
    userId: v.string(),
    month: v.number(), 
    year: v.number(),
  },
  handler: async (ctx, { userId, month, year }) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    let totalRevenue = 0;
    let totalRefunded = 0;
    let pendingAmount = 0;
    let completedCount = 0;
    let refundedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let monthPaymentsCount = 0;
    
    const eventBreakdown: any[] = [];

    for (const event of events) {
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();

      // Lọc theo thời gian trong tháng
      const filteredPayments = payments.filter(
        (p) => p.createdAt >= startOfMonth && p.createdAt <= endOfMonth
      );

      if (filteredPayments.length === 0) continue;

      monthPaymentsCount += filteredPayments.length;
      let eventMonthlyRevenue = 0;
      let eventTicketsSold = 0;

      for (const p of filteredPayments) {
        if (p.status === "completed") {
          totalRevenue += p.amount;
          eventMonthlyRevenue += p.amount;
          completedCount += 1;
          eventTicketsSold += 1;
        } else if (p.status === "refunded") {
          totalRefunded += p.amount;
          refundedCount += 1;
        } else if (p.status === "pending") {
          pendingAmount += p.amount;
          pendingCount += 1;
        } else if (p.status === "failed") {
          failedCount += 1;
        }
      }

      eventBreakdown.push({
        eventId: event._id,
        eventName: event.name,
        ticketsSold: eventTicketsSold,
        revenue: eventMonthlyRevenue,
      });
    }

    return {
      totalRevenue,
      totalRefunded,
      pendingAmount,
      netRevenue: totalRevenue - totalRefunded,
      completedCount,
      refundedCount,
      pendingCount,
      failedCount,
      totalPayments: monthPaymentsCount,
      eventBreakdown,
    };
  },
});