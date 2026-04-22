/**
 * User Validation Tests
 * 
 * Independent validation tests for user operations.
 */

import {
  UserProfileSchema,
  UserIdSchema,
  EmailSchema,
} from "@/lib/validations/userSchema";

describe("Independent Module Validation - User Schema (ASR ID 13)", () => {
  describe("UserProfileSchema - Valid Data", () => {
    it("should validate complete profile data", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        role: "organizer",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow partial data (name only)", () => {
      const data = {
        name: "Jane Smith",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow empty object (all optional)", () => {
      const data = {};

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept user role", () => {
      const data = {
        role: "user",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept organizer role", () => {
      const data = {
        role: "organizer",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("UserProfileSchema - Invalid Data", () => {
    it("should reject name shorter than 2 characters", () => {
      const data = {
        name: "A",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 100 characters", () => {
      const data = {
        name: "A".repeat(101),
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const data = {
        email: "not-an-email",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid role", () => {
      const data = {
        role: "admin",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty name string", () => {
      const data = {
        name: "",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("UserProfileSchema - Email Validation", () => {
    it("should accept valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "john.doe@company.co.uk",
        "test+tag@domain.org",
        "user123@test-domain.com",
      ];

      for (const email of validEmails) {
        const data = { email };
        const result = UserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "not-email",
        "@example.com",
        "user@",
        "user@.com",
        "user name@example.com",
      ];

      for (const email of invalidEmails) {
        const data = { email };
        const result = UserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("UserIdSchema - Valid Data", () => {
    it("should validate user ID", () => {
      const data = {
        userId: "user_123abc456def",
      };

      const result = UserIdSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept Clerk format user IDs", () => {
      const data = {
        userId: "user_35QNkvVhru4fn1kQzkNcuaSL6CT",
      };

      const result = UserIdSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("UserIdSchema - Invalid Data", () => {
    it("should reject missing userId", () => {
      const data = {};

      const result = UserIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty userId", () => {
      const data = {
        userId: "",
      };

      const result = UserIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject non-string userId", () => {
      const data = {
        userId: 123,
      };

      const result = UserIdSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("EmailSchema - Valid Data", () => {
    it("should validate complete email data", () => {
      const data = {
        email: "user@example.com",
        subject: "Event Confirmation",
        body: "Your ticket has been confirmed",
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should allow email only (subject/body optional)", () => {
      const data = {
        email: "user@example.com",
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept long email body", () => {
      const data = {
        email: "user@example.com",
        subject: "Test",
        body: "A".repeat(1000),
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("EmailSchema - Invalid Data", () => {
    it("should reject missing email", () => {
      const data = {
        subject: "Test",
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const data = {
        email: "not-an-email",
        subject: "Test",
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject subject longer than 200 characters", () => {
      const data = {
        email: "user@example.com",
        subject: "A".repeat(201),
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty subject", () => {
      const data = {
        email: "user@example.com",
        subject: "",
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Role Validation", () => {
    it("should validate both valid roles", () => {
      const roles = ["user", "organizer"];

      for (const role of roles) {
        const data = { role };
        const result = UserProfileSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid roles", () => {
      const invalidRoles = ["admin", "moderator", "guest", "seller"];

      for (const role of invalidRoles) {
        const data = { role };
        const result = UserProfileSchema.safeParse(data);
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Boundary Cases", () => {
    it("should accept exactly 2-character name", () => {
      const data = {
        name: "AB",
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept exactly 100-character name", () => {
      const data = {
        name: "A".repeat(100),
      };

      const result = UserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept exactly 200-character subject", () => {
      const data = {
        email: "user@example.com",
        subject: "A".repeat(200),
      };

      const result = EmailSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
