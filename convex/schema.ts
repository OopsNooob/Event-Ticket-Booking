import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// DATABASE INDEXING STRATEGY (Performance - ADD ID 4 & 52)
// ============================================================================
// Comprehensive indexing strategy to prevent full table scans and ensure
// optimal query performance. All frequently queried fields are indexed.
// 
// Indexes by table:
// - events: by_user_id, by_status, by_date
// - tickets: by_user_id, by_event, by_user_event, by_status, by_purchased_date
// - waitingList: by_user_event, by_event_status, by_event, by_status
// - users: by_user_id, by_email, by_role
// - payments: by_user, by_event, by_status, by_user_event, by_created_date
// ============================================================================

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
    isDeleted: v.optional(v.boolean()),
  })
    // Primary lookup: find events by organizer
    .index("by_user_id", ["userId"])
    // Secondary: filter by status (cancelled, active, etc.)
    .index("by_status", ["is_cancelled"])
    // Tertiary: find upcoming events sorted by date
    .index("by_date", ["eventDate"])
    // Combined: find upcoming events for specific organizer
    .index("by_user_date", ["userId", "eventDate"]),

  tickets: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    purchasedAt: v.number(),
    status: v.string(),
    paymentId: v.id("payments"),
    amount: v.number(),
    isDeleted: v.optional(v.boolean()),
  })
    // Primary lookup: user's tickets
    .index("by_user_id", ["userId"])
    // Primary lookup: event's tickets
    .index("by_event", ["eventId"])
    // Combined: find specific user's ticket for event
    .index("by_user_event", ["userId", "eventId"])
    // Secondary: find tickets by status (valid, used, refunded, etc.)
    .index("by_status", ["status"])
    // Tertiary: find recent purchases
    .index("by_purchased_date", ["purchasedAt"])
    // Combined: find event tickets by status
    .index("by_event_status", ["eventId", "status"])
    // Combined: find user tickets by status
    .index("by_user_status", ["userId", "status"]),

  waitingList: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    status: v.string(),
    offerExpiresAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
  })
    // Combined: find specific user's queue position for event
    .index("by_user_event", ["userId", "eventId"])
    // Combined: find queue status for event
    .index("by_event_status", ["eventId", "status"])
    // Primary lookup: find all queue entries for event
    .index("by_event", ["eventId"])
    // Secondary: find waiting entries (not purchased/expired)
    .index("by_status", ["status"])
    // Tertiary: find expired offers for cleanup
    .index("by_offer_expires", ["offerExpiresAt"]),

  users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("organizer"))),
    isDeleted: v.optional(v.boolean()),
  })
    // Primary lookup: find user by Clerk ID
    .index("by_user_id", ["userId"])
    // Primary lookup: find user by email
    .index("by_email", ["email"])
    // Secondary: find all organizers
    .index("by_role", ["role"]),

  payments: defineTable({
    eventId: v.id("events"),
    userId: v.string(),
    amount: v.number(),
    paymentMethod: v.string(),
    status: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    isDeleted: v.optional(v.boolean()),
  })
    // Primary lookup: find user's payments
    .index("by_user", ["userId"])
    // Primary lookup: find event's payments
    .index("by_event", ["eventId"])
    // Secondary: find payments by status (pending, completed, failed, refunded)
    .index("by_status", ["status"])
    // Combined: find specific user's event payments
    .index("by_user_event", ["userId", "eventId"])
    // Tertiary: find recent transactions
    .index("by_created_date", ["createdAt"])
    // Combined: find completed payments for event (for revenue tracking)
    .index("by_event_status", ["eventId", "status"]),
});
