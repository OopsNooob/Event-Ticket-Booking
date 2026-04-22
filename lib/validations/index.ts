/**
 * Validation Schemas - Barrel Export
 * 
 * Testability Architecture: Independent Module Validation (ASR ID 13)
 * 
 * This file provides centralized exports for all validation schemas.
 * Allows for easy import of any validation schema throughout the application.
 * 
 * @example
 * // Frontend usage
 * import { EventSchema } from "@/lib/validations";
 * 
 * @example
 * // Backend usage
 * import { validateEventData } from "@/lib/validations";
 * 
 * @example
 * // Type inference
 * import { EventFormData, PurchaseTicketData } from "@/lib/validations";
 */

// Event validations
export {
  EventSchema,
  validateEventData,
  validateEventDataStrict,
  PartialEventSchema,
  type EventFormData,
  type PartialEventData,
  type ValidationResult,
} from "./eventSchema";

// Ticket validations
export {
  PurchaseTicketSchema,
  RefundTicketSchema,
  TicketQRSchema,
  type PurchaseTicketData,
  type RefundTicketData,
  type TicketQRData,
} from "./ticketSchema";

// User validations
export {
  UserProfileSchema,
  UserIdSchema,
  EmailSchema,
  type UserProfileData,
  type UserIdData,
  type EmailData,
} from "./userSchema";
