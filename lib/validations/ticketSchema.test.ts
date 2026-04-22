/**
 * Ticket Validation Tests
 * 
 * Independent validation tests for ticket operations.
 */

import {
  PurchaseTicketSchema,
  RefundTicketSchema,
  TicketQRSchema,
} from "@/lib/validations/ticketSchema";

describe("Independent Module Validation - Ticket Schema (ASR ID 13)", () => {
  describe("PurchaseTicketSchema - Valid Data", () => {
    it("should validate correct purchase data", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
        quantity: 2,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept default quantity (1)", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "paypal",
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
      }
    });

    it("should accept single ticket", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
        quantity: 1,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept maximum quantity (100)", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
        quantity: 100,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("PurchaseTicketSchema - Invalid Data", () => {
    it("should reject missing eventId", () => {
      const data = {
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid payment method", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "bitcoin",
        quantity: 1,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject quantity < 1", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
        quantity: 0,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject quantity > 100", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
        quantity: 101,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer quantity", () => {
      const data = {
        eventId: "event_123abc",
        userId: "user_456def",
        waitingListId: "waitlist_789ghi",
        paymentMethod: "stripe",
        quantity: 2.5,
      };

      const result = PurchaseTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("RefundTicketSchema - Valid Data", () => {
    it("should validate correct refund data", () => {
      const data = {
        ticketId: "ticket_123abc",
        reason: "I cannot attend the event",
      };

      const result = RefundTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept minimum reason length", () => {
      const data = {
        ticketId: "ticket_123abc",
        reason: "12345", // 5 chars minimum
      };

      const result = RefundTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow optional reason", () => {
      const data = {
        ticketId: "ticket_123abc",
      };

      const result = RefundTicketSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("RefundTicketSchema - Invalid Data", () => {
    it("should reject missing ticketId", () => {
      const data = {
        reason: "I cannot attend",
      };

      const result = RefundTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject reason shorter than 5 characters", () => {
      const data = {
        ticketId: "ticket_123abc",
        reason: "No",
      };

      const result = RefundTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject reason longer than 500 characters", () => {
      const data = {
        ticketId: "ticket_123abc",
        reason: "A".repeat(501),
      };

      const result = RefundTicketSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("TicketQRSchema - Valid Data", () => {
    it("should validate correct QR data", () => {
      const data = {
        ticketId: "ticket_123abc",
        eventId: "event_456def",
        code: "QR_1234567890",
      };

      const result = TicketQRSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept long QR codes", () => {
      const data = {
        ticketId: "ticket_123abc",
        eventId: "event_456def",
        code: "QR_" + "A".repeat(100),
      };

      const result = TicketQRSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("TicketQRSchema - Invalid Data", () => {
    it("should reject missing ticketId", () => {
      const data = {
        eventId: "event_456def",
        code: "QR_1234567890",
      };

      const result = TicketQRSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject code shorter than 10 characters", () => {
      const data = {
        ticketId: "ticket_123abc",
        eventId: "event_456def",
        code: "QR_123",
      };

      const result = TicketQRSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject all missing fields", () => {
      const data = {};

      const result = TicketQRSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
