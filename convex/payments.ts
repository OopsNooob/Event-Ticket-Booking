import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
export const refundPayment = mutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db.get(paymentId);
    
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "completed") {
      throw new Error("Can only refund completed payments");
    }

    await ctx.db.patch(paymentId, {
      status: "refunded",
      refundedAt: Date.now(),
    });

    return { success: true };
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

    // Get event details for each payment
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
 * Get all payments for an event (for sellers)
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

/**
 * Get seller's total revenue and payment stats
 */
export const getSellerStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Get all events created by this seller
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const eventIds = events.map((e) => e._id);

    // Get all payments for these events
    const allPayments = await Promise.all(
      eventIds.map((eventId) =>
        ctx.db
          .query("payments")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect()
      )
    );

    const payments = allPayments.flat();

    // Calculate stats
    const totalRevenue = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const completedCount = payments.filter((p) => p.status === "completed").length;
    const refundedCount = payments.filter((p) => p.status === "refunded").length;
    const pendingCount = payments.filter((p) => p.status === "pending").length;
    const failedCount = payments.filter((p) => p.status === "failed").length;

    return {
      totalRevenue,
      totalRefunded,
      pendingAmount,
      netRevenue: totalRevenue - totalRefunded,
      completedCount,
      refundedCount,
      pendingCount,
      failedCount,
      totalPayments: payments.length,
    };
  },
});

/**
 * Get seller stats for a specific month
 */
export const getSellerStatsByMonth = query({
  args: { 
    userId: v.string(),
    month: v.number(), // 1-12
    year: v.number(),
  },
  handler: async (ctx, { userId, month, year }) => {
    // Get all events created by this seller
    const events = await ctx.db
      .query("events")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();

    const eventIds = events.map((e) => e._id);

    // Get all payments for these events
    const allPayments = await Promise.all(
      eventIds.map((eventId) =>
        ctx.db
          .query("payments")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect()
      )
    );

    const payments = allPayments.flat();

    // Filter payments by month/year
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();
    
    const monthPayments = payments.filter(
      (p) => p.createdAt >= startOfMonth && p.createdAt <= endOfMonth
    );

    // Calculate stats
    const totalRevenue = monthPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = monthPayments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = monthPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const completedCount = monthPayments.filter((p) => p.status === "completed").length;
    const refundedCount = monthPayments.filter((p) => p.status === "refunded").length;
    const pendingCount = monthPayments.filter((p) => p.status === "pending").length;
    const failedCount = monthPayments.filter((p) => p.status === "failed").length;

    // Get event breakdown
    const eventBreakdown = await Promise.all(
      eventIds.map(async (eventId) => {
        const event = await ctx.db.get(eventId);
        if (!event) return null;

        const eventPayments = monthPayments.filter((p) => p.eventId === eventId);
        if (eventPayments.length === 0) return null;

        const revenue = eventPayments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          eventId,
          eventName: event.name,
          ticketsSold: eventPayments.filter((p) => p.status === "completed").length,
          revenue,
        };
      })
    );

    const validBreakdown = eventBreakdown.filter((e) => e !== null);

    return {
      totalRevenue,
      totalRefunded,
      pendingAmount,
      netRevenue: totalRevenue - totalRefunded,
      completedCount,
      refundedCount,
      pendingCount,
      failedCount,
      totalPayments: monthPayments.length,
      eventBreakdown: validBreakdown,
    };
  },
});