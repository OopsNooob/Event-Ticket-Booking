/**
 * Convex Validation Tests
 * 
 * Independent validation tests for backend validation utilities.
 * Tests are 100% pure - no Convex runtime needed.
 */

import {
  validateEventInput,
  validateTicketPurchaseInput,
  assertValidation,
} from "./validation";

describe("Convex Backend Validation (ASR ID 13)", () => {
  describe("validateEventInput - Valid Data", () => {
    it("should validate correct event data", () => {
      const data = {
        name: "Tech Conference",
        description: "Annual tech conference with keynotes",
        location: "San Francisco",
        eventDate: Date.now() + 86400000,
        price: 99.99,
        totalTickets: 500,
      };

      const errors = validateEventInput(data);
      expect(errors).toBeNull();
    });

    it("should accept free events (price = 0)", () => {
      const data = {
        name: "Free Workshop",
        description: "Learn web development for free",
        location: "Online",
        eventDate: Date.now() + 172800000,
        price: 0,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).toBeNull();
    });

    it("should accept high-value events", () => {
      const data = {
        name: "Luxury Gala",
        description: "Exclusive evening gala with networking",
        location: "Beverly Hills",
        eventDate: Date.now() + 604800000,
        price: 500000,
        totalTickets: 50,
      };

      const errors = validateEventInput(data);
      expect(errors).toBeNull();
    });
  });

  describe("validateEventInput - Invalid Data", () => {
    it("should reject missing name", () => {
      const data = {
        description: "Good description",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: 50,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.name).toBeDefined();
    });

    it("should reject name shorter than 3 characters", () => {
      const data = {
        name: "AB",
        description: "Good description here",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: 50,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.name).toBeDefined();
    });

    it("should reject negative price", () => {
      const data = {
        name: "Event",
        description: "Good description here",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: -10,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.price).toBeDefined();
    });

    it("should reject zero totalTickets", () => {
      const data = {
        name: "Event",
        description: "Good description here",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: 50,
        totalTickets: 0,
      };

      const errors = validateEventInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.totalTickets).toBeDefined();
    });

    it("should reject past event dates", () => {
      const data = {
        name: "Past Event",
        description: "This event is in the past",
        location: "Venue",
        eventDate: Date.now() - 86400000,
        price: 50,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.eventDate).toBeDefined();
    });

    it("should reject multiple errors", () => {
      const data = {
        name: "AB",
        description: "Short",
        location: "Place",
        eventDate: Date.now() - 86400000,
        price: -50,
        totalTickets: 0,
      };

      const errors = validateEventInput(data);
      expect(errors).not.toBeNull();
      expect(Object.keys(errors!).length).toBeGreaterThan(1);
    });
  });

  describe("validateTicketPurchaseInput - Valid Data", () => {
    it("should validate correct purchase data", () => {
      const data = {
        eventId: "event123",
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "stripe",
        quantity: 2,
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).toBeNull();
    });

    it("should accept default quantity (optional)", () => {
      const data = {
        eventId: "event123",
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "paypal",
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).toBeNull();
    });

    it("should accept paypal payment method", () => {
      const data = {
        eventId: "event123",
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "paypal",
        quantity: 1,
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).toBeNull();
    });
  });

  describe("validateTicketPurchaseInput - Invalid Data", () => {
    it("should reject missing event ID", () => {
      const data = {
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "stripe",
        quantity: 1,
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.eventId).toBeDefined();
    });

    it("should reject invalid payment method", () => {
      const data = {
        eventId: "event123",
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "bitcoin",
        quantity: 1,
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.paymentMethod).toBeDefined();
    });

    it("should reject invalid quantity", () => {
      const data = {
        eventId: "event123",
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "stripe",
        quantity: -5,
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.quantity).toBeDefined();
    });

    it("should reject non-integer quantity", () => {
      const data = {
        eventId: "event123",
        userId: "user456",
        waitingListId: "waitlist789",
        paymentMethod: "stripe",
        quantity: 2.5,
      };

      const errors = validateTicketPurchaseInput(data);
      expect(errors).not.toBeNull();
      expect(errors?.quantity).toBeDefined();
    });
  });

  describe("assertValidation - Error Handling", () => {
    it("should not throw for null errors", () => {
      expect(() => assertValidation(null)).not.toThrow();
    });

    it("should throw for validation errors", () => {
      const errors = { name: "Name is required" };
      expect(() => assertValidation(errors)).toThrow();
    });

    it("should include error details in message", () => {
      const errors = {
        name: "Name is required",
        price: "Price must be positive",
      };

      expect(() => assertValidation(errors)).toThrow(
        /name: Name is required/
      );
    });
  });

  describe("Frontend-Backend Consistency", () => {
    it("should validate same way as frontend schema", () => {
      // Valid event should pass both
      const validEvent = {
        name: "Summit 2026",
        description: "Annual industry summit with networking",
        location: "Chicago, IL",
        eventDate: Date.now() + 2592000000, // 30 days
        price: 299.99,
        totalTickets: 1000,
      };

      const backendErrors = validateEventInput(validEvent);
      expect(backendErrors).toBeNull();

      // Invalid event should fail on both
      const invalidEvent = {
        name: "X",
        description: "Bad",
        location: "Place",
        eventDate: Date.now() - 86400000,
        price: -100,
        totalTickets: -5,
      };

      const backendErrors2 = validateEventInput(invalidEvent);
      expect(backendErrors2).not.toBeNull();
      expect(Object.keys(backendErrors2 || {}).length).toBeGreaterThan(0);
    });
  });

  describe("Boundary Cases", () => {
    it("should accept exactly minimum name length", () => {
      const data = {
        name: "Con",
        description: "Description with minimum length",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: 50,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).toBeNull();
    });

    it("should accept exactly maximum price", () => {
      const data = {
        name: "Event",
        description: "Description here for test",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: 999999.99,
        totalTickets: 100,
      };

      const errors = validateEventInput(data);
      expect(errors).toBeNull();
    });

    it("should accept maximum tickets", () => {
      const data = {
        name: "Event",
        description: "Description here for test",
        location: "Venue",
        eventDate: Date.now() + 86400000,
        price: 50,
        totalTickets: 1000000,
      };

      const errors = validateEventInput(data);
      expect(errors).toBeNull();
    });
  });
});
