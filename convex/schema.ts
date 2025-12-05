import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    name: v.string(),
    description: v.string(),
    location: v.string(),
    eventDate: v.number(),
    price: v.number(),
    totalTickets: v.number(),
    userId: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    is_cancelled: v.optional(v.boolean()),
  }).index("by_user_id", ["userId"]),

  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    purchasedAt: v.number(),
    status: v.string(),
    paymentId: v.id("payments"),
    amount: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_user_event", ["userId", "eventId"]), // Add this line

  waitingList: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    status: v.string(),
    offerExpiresAt: v.optional(v.number()),
  })
    .index("by_user_event", ["userId", "eventId"])
    .index("by_event_status", ["eventId", "status"]),

  users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("organizer"))), // Optional để support existing users
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),

  payments: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    amount: v.number(),
    paymentMethod: v.string(), // "card", "bank_transfer", "cash", "ewallet"
    status: v.string(), // "pending", "completed", "failed", "refunded"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_status", ["status"]),
});
