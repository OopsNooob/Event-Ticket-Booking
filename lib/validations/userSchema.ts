/**
 * User Validation Schema
 * 
 * Testability Architecture: Independent Module Validation (ASR ID 13)
 */

import { z } from "zod";

/**
 * User Profile Update Schema
 * 
 * Validates user profile information updates.
 */
export const UserProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),

  email: z
    .string()
    .email("Invalid email address")
    .optional(),

  role: z
    .enum(["user", "organizer"], {
      errorMap: () => ({ message: "Role must be 'user' or 'organizer'" }),
    })
    .optional(),
});

export type UserProfileData = z.infer<typeof UserProfileSchema>;

/**
 * User ID Validation
 * 
 * Validates Clerk user identifiers.
 */
export const UserIdSchema = z.object({
  userId: z
    .string()
    .min(1, "User ID is required")
    .describe("Clerk user ID"),
});

export type UserIdData = z.infer<typeof UserIdSchema>;

/**
 * Email Validation
 * 
 * Validates email addresses for notifications and communications.
 */
export const EmailSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  subject: z
    .string()
    .min(1, "Email subject is required")
    .max(200, "Subject is too long")
    .optional(),

  body: z
    .string()
    .min(1, "Email body is required")
    .optional(),
});

export type EmailData = z.infer<typeof EmailSchema>;
