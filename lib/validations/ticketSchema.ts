/**
 * Ticket Validation Schema
 * 
 * Testability Architecture: Independent Module Validation (ASR ID 13)
 */

import { z } from "zod";

/**
 * Purchase Ticket Schema
 * 
 * Validates ticket purchase parameters.
 * Used by PurchaseTicket component and purchaseTicket mutation.
 */
export const PurchaseTicketSchema = z.object({
  eventId: z
    .string()
    .min(1, "Event ID is required")
    .describe("Convex ID of the event"),

  userId: z
    .string()
    .min(1, "User ID is required")
    .describe("Clerk user ID"),

  waitingListId: z
    .string()
    .min(1, "Waiting list ID is required")
    .describe("Convex ID of waiting list entry"),

  paymentMethod: z
    .enum(["stripe", "paypal"], {
      errorMap: () => ({ message: "Payment method must be 'stripe' or 'paypal'" }),
    })
    .describe("Payment method used"),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Must purchase at least 1 ticket")
    .max(100, "Cannot purchase more than 100 tickets at once")
    .optional()
    .default(1),
});

export type PurchaseTicketData = z.infer<typeof PurchaseTicketSchema>;

/**
 * Refund Ticket Schema
 * 
 * Validates refund request parameters.
 * Used by ticket refund operations.
 */
export const RefundTicketSchema = z.object({
  ticketId: z
    .string()
    .min(1, "Ticket ID is required"),

  reason: z
    .string()
    .min(5, "Refund reason must be at least 5 characters")
    .max(500, "Refund reason must be less than 500 characters")
    .optional(),
});

export type RefundTicketData = z.infer<typeof RefundTicketSchema>;

/**
 * Ticket QR Validation
 * 
 * Validates ticket QR code data for entry verification.
 */
export const TicketQRSchema = z.object({
  ticketId: z
    .string()
    .min(1, "Ticket ID is required"),

  eventId: z
    .string()
    .min(1, "Event ID is required"),

  code: z
    .string()
    .min(10, "QR code must be valid")
    .describe("QR code unique identifier"),
});

export type TicketQRData = z.infer<typeof TicketQRSchema>;
