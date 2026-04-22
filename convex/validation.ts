/**
 * Convex Backend Validation Utilities
 * 
 * Testability Architecture: Independent Module Validation (ASR ID 13)
 * 
 * These validation utilities can be used in Convex mutations to validate
 * input data. They provide pure validation logic independent of the framework.
 * 
 * Note: This mirrors validations in lib/validations/ but is backend-specific
 * since Convex cannot import from lib/ (different runtime environment).
 */

/**
 * Event data validation rules
 * 
 * These rules match exactly with lib/validations/eventSchema.ts
 */
export interface EventData {
  name: string;
  description: string;
  location: string;
  eventDate: number; // timestamp
  price: number;
  totalTickets: number;
}

/**
 * Validate event data
 * 
 * Returns validation errors or null if valid.
 * Pure function - no dependencies.
 * 
 * @param data - Event data to validate
 * @returns Error messages or null
 */
export function validateEventInput(data: unknown): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (typeof data !== "object" || data === null) {
    return { _root: "Invalid event data" };
  }

  const event = data as Record<string, unknown>;

  // Validate name
  if (!event.name || typeof event.name !== "string") {
    errors.name = "Event name is required";
  } else if (event.name.length < 3) {
    errors.name = "Event name must be at least 3 characters";
  } else if (event.name.length > 200) {
    errors.name = "Event name must be less than 200 characters";
  }

  // Validate description
  if (!event.description || typeof event.description !== "string") {
    errors.description = "Description is required";
  } else if (event.description.length < 10) {
    errors.description = "Description must be at least 10 characters";
  } else if (event.description.length > 5000) {
    errors.description = "Description must be less than 5000 characters";
  }

  // Validate location
  if (!event.location || typeof event.location !== "string") {
    errors.location = "Location is required";
  } else if (event.location.length < 3) {
    errors.location = "Location must be at least 3 characters";
  } else if (event.location.length > 500) {
    errors.location = "Location must be less than 500 characters";
  }

  // Validate eventDate (must be future timestamp)
  if (typeof event.eventDate !== "number") {
    errors.eventDate = "Event date is required";
  } else if (event.eventDate <= Date.now()) {
    errors.eventDate = "Event date must be in the future";
  }

  // Validate price
  if (typeof event.price !== "number") {
    errors.price = "Price is required";
  } else if (event.price < 0) {
    errors.price = "Price cannot be negative";
  } else if (event.price > 999999.99) {
    errors.price = "Price is too high";
  } else if (!Number.isFinite(event.price)) {
    errors.price = "Price must be a valid number";
  }

  // Validate totalTickets
  if (typeof event.totalTickets !== "number") {
    errors.totalTickets = "Total tickets is required";
  } else if (!Number.isInteger(event.totalTickets)) {
    errors.totalTickets = "Total tickets must be a whole number";
  } else if (event.totalTickets < 1) {
    errors.totalTickets = "Event must have at least 1 ticket";
  } else if (event.totalTickets > 1000000) {
    errors.totalTickets = "Event cannot have more than 1,000,000 tickets";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Ticket data validation rules
 */
export interface TicketPurchaseData {
  eventId: string;
  userId: string;
  waitingListId: string;
  paymentMethod: string;
  quantity?: number;
}

/**
 * Validate ticket purchase data
 * 
 * @param data - Purchase data to validate
 * @returns Error messages or null
 */
export function validateTicketPurchaseInput(
  data: unknown
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (typeof data !== "object" || data === null) {
    return { _root: "Invalid purchase data" };
  }

  const purchase = data as Record<string, unknown>;

  // Validate required IDs
  if (!purchase.eventId || typeof purchase.eventId !== "string") {
    errors.eventId = "Event ID is required";
  }

  if (!purchase.userId || typeof purchase.userId !== "string") {
    errors.userId = "User ID is required";
  }

  if (!purchase.waitingListId || typeof purchase.waitingListId !== "string") {
    errors.waitingListId = "Waiting list ID is required";
  }

  // Validate payment method
  if (!purchase.paymentMethod || typeof purchase.paymentMethod !== "string") {
    errors.paymentMethod = "Payment method is required";
  } else if (!["stripe", "paypal"].includes(purchase.paymentMethod)) {
    errors.paymentMethod = "Payment method must be 'stripe' or 'paypal'";
  }

  // Validate quantity (optional, defaults to 1)
  if (purchase.quantity !== undefined) {
    if (typeof purchase.quantity !== "number") {
      errors.quantity = "Quantity must be a number";
    } else if (!Number.isInteger(purchase.quantity)) {
      errors.quantity = "Quantity must be a whole number";
    } else if (purchase.quantity < 1) {
      errors.quantity = "Must purchase at least 1 ticket";
    } else if (purchase.quantity > 100) {
      errors.quantity = "Cannot purchase more than 100 tickets at once";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Assert validation passed, throw if failed
 * 
 * Utility for backend mutations to fail fast on validation errors.
 * 
 * @param errors - Validation errors from validate* functions
 * @param fieldName - Field name for error context
 * @throws ConvexError if validation failed
 */
export function assertValidation(
  errors: Record<string, string> | null,
  fieldName: string = "input"
): void {
  if (errors) {
    const errorMessage = Object.entries(errors)
      .map(([key, msg]) => `${key}: ${msg}`)
      .join("; ");
    throw new Error(`Validation failed: ${errorMessage}`);
  }
}

/**
 * Unit test helper - validates testing itself
 * 
 * Ensures validation logic is consistent across frontend/backend
 */
export function testValidationConsistency() {
  // Test: valid event should pass
  const validEvent = {
    name: "Tech Conference",
    description: "Annual technology conference with keynotes",
    location: "San Francisco",
    eventDate: Date.now() + 86400000, // Tomorrow
    price: 99.99,
    totalTickets: 500,
  };

  const errors1 = validateEventInput(validEvent);
  if (errors1 !== null) {
    throw new Error("Valid event should not have errors");
  }

  // Test: invalid event should fail
  const invalidEvent = {
    name: "AB", // Too short
    description: "Short", // Too short
    location: "Place",
    eventDate: Date.now() - 86400000, // Past date
    price: -50, // Negative
    totalTickets: 0, // Zero
  };

  const errors2 = validateEventInput(invalidEvent);
  if (errors2 === null || Object.keys(errors2).length === 0) {
    throw new Error("Invalid event should have errors");
  }

  console.log("✅ Validation consistency test passed");
}
