/**
 * Event Validation Tests
 * 
 * These tests verify that validation logic works independently
 * without needing to run Next.js or any other framework.
 * 
 * Pure validation functions = 100% unit-testable
 */

import {
  EventSchema,
  validateEventData,
  validateEventDataStrict,
  PartialEventSchema,
} from "@/lib/validations/eventSchema";
import { z } from "zod";

describe("Independent Module Validation - Event Schema (ASR ID 13)", () => {
  describe("EventSchema - Valid Data", () => {
    it("should validate correct event data", () => {
      const validData = {
        name: "Tech Conference 2026",
        description: "An exciting conference about latest technologies",
        location: "San Francisco, CA",
        eventDate: new Date(Date.now() + 86400000), // Tomorrow
        price: 99.99,
        totalTickets: 500,
      };

      const result = EventSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Tech Conference 2026");
        expect(result.data.price).toBe(99.99);
      }
    });

    it("should accept free events (price = 0)", () => {
      const data = {
        name: "Free Workshop",
        description: "Learn web development basics for free",
        location: "Online",
        eventDate: new Date(Date.now() + 172800000), // In 2 days
        price: 0,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept high-value events", () => {
      const data = {
        name: "Luxury Gala",
        description: "Exclusive evening gala with networking opportunities",
        location: "Beverly Hills",
        eventDate: new Date(Date.now() + 604800000), // Next week
        price: 500000,
        totalTickets: 50,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept large event capacities", () => {
      const data = {
        name: "Music Festival",
        description: "Annual music festival featuring top artists",
        location: "Desert venue",
        eventDate: new Date(Date.now() + 1209600000), // 2 weeks
        price: 150,
        totalTickets: 50000,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("EventSchema - Invalid Data", () => {
    it("should reject missing name", () => {
      const data = {
        description: "Good description",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const data = {
        name: "",
        description: "Good description",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("should reject name shorter than 3 characters", () => {
      const data = {
        name: "AB",
        description: "Good description",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 200 characters", () => {
      const data = {
        name: "A".repeat(201),
        description: "Good description",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject description shorter than 10 characters", () => {
      const data = {
        name: "Event Name",
        description: "Short",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative price", () => {
      const data = {
        name: "Event Name",
        description: "Good description with enough characters",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: -10,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject zero totalTickets", () => {
      const data = {
        name: "Event Name",
        description: "Good description with enough characters",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 0,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject non-integer totalTickets", () => {
      const data = {
        name: "Event Name",
        description: "Good description with enough characters",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 10.5,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject past event dates", () => {
      const data = {
        name: "Event Name",
        description: "Good description with enough characters",
        location: "Venue",
        eventDate: new Date(Date.now() - 86400000), // Yesterday
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing location", () => {
      const data = {
        name: "Event Name",
        description: "Good description with enough characters",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("validateEventData - Helper Function", () => {
    it("should return success object with valid data", () => {
      const data = {
        name: "Conference",
        description: "Annual tech conference with keynotes",
        location: "NYC",
        eventDate: new Date(Date.now() + 86400000),
        price: 199,
        totalTickets: 1000,
      };

      const result = validateEventData(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Conference");
      }
    });

    it("should return error object with invalid data", () => {
      const data = {
        name: "",
        description: "Too short",
        price: -50,
        totalTickets: 0,
      };

      const result = validateEventData(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      }
    });

    it("should return multiple field errors", () => {
      const data = {
        name: "AB", // Too short
        description: "Short", // Too short
        location: "Venue",
        eventDate: new Date(Date.now() - 86400000), // Past date
        price: -100, // Negative
        totalTickets: 0, // Not enough
      };

      const result = validateEventData(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Object.keys(result.errors).length).toBeGreaterThan(1);
      }
    });
  });

  describe("validateEventDataStrict - Strict Validation", () => {
    it("should return parsed data for valid input", () => {
      const data = {
        name: "Summit",
        description: "Annual industry summit with networking",
        location: "Chicago",
        eventDate: new Date(Date.now() + 259200000),
        price: 299.99,
        totalTickets: 2000,
      };

      const result = validateEventDataStrict(data);
      expect(result.name).toBe("Summit");
      expect(result.price).toBe(299.99);
    });

    it("should throw ZodError for invalid data", () => {
      const data = {
        name: "",
        description: "Too short",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: -50,
        totalTickets: 0,
      };

      expect(() => validateEventDataStrict(data)).toThrow();
    });

    it("should throw for missing required fields", () => {
      const data = {
        name: "Event",
        // Missing other fields
      };

      expect(() => validateEventDataStrict(data)).toThrow();
    });
  });

  describe("PartialEventSchema - Partial Updates", () => {
    it("should validate partial data with only name", () => {
      const data = {
        name: "Updated Event Name",
      };

      const result = PartialEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate partial data with multiple fields", () => {
      const data = {
        name: "New Name",
        price: 199.99,
      };

      const result = PartialEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should still validate field constraints", () => {
      const data = {
        name: "AB", // Too short
      };

      const result = PartialEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should allow empty object for partial schema", () => {
      const data = {};

      const result = PartialEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Inference - EventFormData", () => {
    it("should infer correct types from schema", () => {
      const data = {
        name: "Test Event",
        description: "This is a test event description",
        location: "Test Location",
        eventDate: new Date(),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      if (result.success) {
        // TypeScript should know these types
        const name: string = result.data.name;
        const price: number = result.data.price;
        const date: Date = result.data.eventDate;
        
        expect(typeof name).toBe("string");
        expect(typeof price).toBe("number");
        expect(date instanceof Date).toBe(true);
      }
    });
  });

  describe("Edge Cases & Boundary Values", () => {
    it("should accept exactly 1 ticket", () => {
      const data = {
        name: "Exclusive Event",
        description: "One-on-one exclusive coaching session",
        location: "Online",
        eventDate: new Date(Date.now() + 86400000),
        price: 5000,
        totalTickets: 1,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept exactly 1,000,000 tickets", () => {
      const data = {
        name: "Massive Event",
        description: "Global online event for everyone",
        location: "Virtual",
        eventDate: new Date(Date.now() + 2592000000),
        price: 0,
        totalTickets: 1000000,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject more than 1,000,000 tickets", () => {
      const data = {
        name: "Too Many",
        description: "More than allowed capacity",
        location: "Virtual",
        eventDate: new Date(Date.now() + 86400000),
        price: 0,
        totalTickets: 1000001,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should accept maximum price", () => {
      const data = {
        name: "Ultra Luxury",
        description: "Most expensive event ever",
        location: "Private Island",
        eventDate: new Date(Date.now() + 86400000),
        price: 999999.99,
        totalTickets: 1,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept exactly 3-character name", () => {
      const data = {
        name: "Con",
        description: "Short but valid event name",
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept exactly 10-character description", () => {
      const data = {
        name: "Event",
        description: "0123456789", // Exactly 10 chars
        location: "Venue",
        eventDate: new Date(Date.now() + 86400000),
        price: 50,
        totalTickets: 100,
      };

      const result = EventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
