/**
 * Event Validation Schema
 * 
 * Testability Architecture: Independent Module Validation (ASR ID 13)
 * 
 * This module provides pure validation logic separated from UI and backend concerns.
 * Benefits:
 * - ✅ 100% unit-testable without running Next.js
 * - ✅ Shared between UI forms and backend mutations
 * - ✅ Type-safe with full TypeScript support
 * - ✅ Single source of truth for validation rules
 * 
 * Usage:
 * - Frontend: import { EventSchema } from "@/lib/validations/eventSchema"
 * - Backend: import { EventSchema } from "@/lib/validations/eventSchema"
 * - Tests:   import { EventSchema } from "@/lib/validations/eventSchema"
 */

import { z } from "zod";

/**
 * Event Creation & Update Schema
 * 
 * Validates all required fields for creating or updating an event.
 * Used by EventForm (frontend) and event mutations (backend).
 */
export const EventSchema = z.object({
  name: z
    .string()
    .min(1, "Event name is required")
    .min(3, "Event name must be at least 3 characters")
    .max(200, "Event name must be less than 200 characters"),

  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),

  location: z
    .string()
    .min(1, "Location is required")
    .min(3, "Location must be at least 3 characters")
    .max(500, "Location must be less than 500 characters"),

  eventDate: z
    .date()
    .min(
      new Date(new Date().setHours(0, 0, 0, 0)),
      "Event date must be today or in the future"
    )
    .refine(
      (date) => date.getTime() > Date.now() - 86400000,
      "Event date must be today or later"
    ),

  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(999999.99, "Price is too high")
    .refine(
      (val) => Number.isFinite(val),
      "Price must be a valid number"
    ),

  totalTickets: z
    .number()
    .int("Total tickets must be a whole number")
    .min(1, "Event must have at least 1 ticket")
    .max(1000000, "Event cannot have more than 1,000,000 tickets")
    .refine(
      (val) => Number.isInteger(val),
      "Total tickets must be an integer"
    ),
});

/**
 * Type inference from EventSchema
 * 
 * This allows TypeScript to automatically infer the type
 * from the schema, ensuring type consistency across the application.
 */
export type EventFormData = z.infer<typeof EventSchema>;

/**
 * Event Validation Result Type
 * 
 * Standardized return type for validation operations.
 * Used in test suites and validation utilities.
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

/**
 * Validate event data
 * 
 * Pure function that validates data against EventSchema.
 * Can be called from both frontend and backend.
 * 
 * @param data - Raw event data to validate
 * @returns ValidationResult with parsed data or field errors
 * 
 * @example
 * // In component
 * const result = validateEventData(formData);
 * if (result.success) {
 *   await createEvent(result.data);
 * }
 * 
 * @example
 * // In mutation
 * const validation = validateEventData(input);
 * if (!validation.success) {
 *   throw new Error(JSON.stringify(validation.errors));
 * }
 */
export function validateEventData(data: unknown): ValidationResult<EventFormData> {
  const result = EventSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validate event data (strict version)
 * 
 * Throws ZodError if validation fails.
 * Use in backend mutations where you want to fail fast.
 * 
 * @param data - Raw event data to validate
 * @returns Parsed EventFormData
 * @throws ZodError if validation fails
 * 
 * @example
 * // In Convex mutation
 * try {
 *   const validated = validateEventDataStrict(input);
 *   // Process validated data
 * } catch (error) {
 *   // Handle validation error
 * }
 */
export function validateEventDataStrict(data: unknown): EventFormData {
  return EventSchema.parse(data);
}

/**
 * Partial event validation schema
 * 
 * For scenarios where you only want to validate a subset of fields.
 * Useful for partial updates or patch operations.
 * 
 * @example
 * // Update only name and price
 * const PartialSchema = EventSchema.partial();
 * PartialSchema.parse({ name: "New Name", price: 50 });
 */
export const PartialEventSchema = EventSchema.partial();

export type PartialEventData = z.infer<typeof PartialEventSchema>;
