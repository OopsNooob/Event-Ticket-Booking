import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
// import { Id } from "./_generated/dataModel";

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

    // 1. Fetch Event Details
    const event = await ctx.db.get(eventId);
    if (!event || event.isDeleted || event.is_cancelled) {
      throw new Error("Sự kiện không tồn tại hoặc đã bị hủy.");
    }

    if (quantity <= 0) {
      throw new Error("Số lượng vé phải lớn hơn 0.");
    }

    // 2. Count currently valid/used tickets for this event
    const existingTickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();

    const purchasedCount = existingTickets.filter(
      (t) => (t.status === "valid" || t.status === "used") && !t.isDeleted
    ).length;

    // 3. CONCURRENCY CONTROL (ADD ID 59): Chống bán vượt quá số lượng
    // Do mọi logic đọc (read) và ghi (write) nằm trong cùng 1 hàm mutation của Convex,
    // Database sẽ lock state lại, loại bỏ hoàn toàn khả năng Race Condition.
    if (purchasedCount + quantity > event.totalTickets) {
      throw new Error("Concurrency Control: Vé đã bán hết hoặc không đủ số lượng bạn yêu cầu, giao dịch bị hủy!");
    }

    // 4. Create Payment Record (Internal/Direct)
    const totalAmount = event.price * quantity;
    const paymentId = await ctx.db.insert("payments", {
      eventId,
      userId,
      amount: totalAmount,
      paymentMethod,
      status: "completed", // Hoàn thành ngay vì là thanh toán nội bộ
      createdAt: Date.now(),
      completedAt: Date.now(),
    });

    // 5. Batch Insert Tickets (Tạo hàng loạt vé - Tối ưu hiệu suất theo ADD ID 58)
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
 * Paginated User Payments Query
 * * Performance: Pagination for Large Datasets (SAD 12.4)
 * Returns user's payments in pages. Critical for users with 1000+ transactions.
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
 * Paginated Event Payments Query
 * * Performance: Pagination for Large Datasets (SAD 12.4)
 * Returns event's payments in pages. Critical for popular events with 10K+ orders.
 */
export const getEventPaymentsPaginated = query({
  args: {
    eventId: v.id("events"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { eventId, paginationOpts }) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .order("desc")
      .paginate(paginationOpts);
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