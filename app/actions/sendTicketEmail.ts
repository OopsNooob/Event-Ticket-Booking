"use server";

import { sendTicketEmail, sendMultipleTicketsEmail } from "@/lib/email";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// RETRY MECHANISM FOR FAULT TOLERANCE (Availability - ASR ID 39)
// ============================================================================
// Implements automatic retry logic with exponential backoff to handle
// network failures, timeouts, and temporary service unavailability.
// This ensures maximum delivery of ticket emails to users.
// ============================================================================

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second initial delay
  maxDelayMs: 10000, // Max 10 seconds between retries
  backoffMultiplier: 2, // Double delay each retry
};

/**
 * Calculates delay for exponential backoff
 * Delay increases: 1s → 2s → 4s (max 10s)
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute with retries
 * @param context - Description for logging
 * @param config - Retry configuration
 * @returns Result of the function or throws after max retries
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}/${config.maxRetries}: ${context}`);
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(
        `❌ Attempt ${attempt + 1} failed: ${context}`,
        `Error: ${errorMessage}`
      );

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries - 1) {
        console.error(
          `🛑 All ${config.maxRetries} retry attempts failed for: ${context}`
        );
        throw new Error(
          `Failed after ${config.maxRetries} retry attempts: ${errorMessage}`
        );
      }

      // Calculate backoff delay
      const delayMs = calculateBackoffDelay(attempt, config);
      console.log(
        `⏳ Waiting ${delayMs}ms before retry attempt ${attempt + 2}...`
      );
      
      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // Fallback (should never reach here)
  throw lastError instanceof Error 
    ? lastError 
    : new Error("Unknown error occurred");
}

export async function sendTicketEmailAction(ticketId: Id<"tickets">) {
  console.log("📧 Starting email send action for ticket:", ticketId);
  
  const convex = getConvexClient();

  try {
    // Get ticket details with retry
    const ticket = await withRetry(
      () => convex.query(api.tickets.getTicketWithDetails, { ticketId }),
      `Fetch ticket details for ${ticketId}`
    );

    console.log("Ticket details:", ticket);

    if (!ticket || !ticket.event) {
      console.error("❌ Ticket or event not found");
      throw new Error("Ticket or event not found");
    }

    // Get user details with retry
    const user = await withRetry(
      () => convex.query(api.users.getUserById, { userId: ticket.userId }),
      `Fetch user details for ${ticket.userId}`
    );

    console.log("User details:", user);

    if (!user || !user.email) {
      console.error("❌ User email not found");
      throw new Error("User email not found");
    }

    console.log("📧 Sending email to:", user.email);

    // Generate QR code with retry
    const QRCode = require("qrcode");
    const qrCodeDataUrl = await withRetry(
      () => QRCode.toDataURL(
        JSON.stringify({
          ticketId: ticket._id,
          eventId: ticket.eventId,
          userId: ticket.userId,
        }),
        {
          width: 500,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        }
      ),
      "Generate QR code for ticket"
    ) as string;

    console.log("✅ QR code generated");

    // Send email with retry - CRITICAL with fault tolerance
    const result = await withRetry(
      () => sendTicketEmail({
        to: user.email,
        ticketId: ticket._id,
        eventName: ticket.event!.name,
        eventDate: ticket.event!.eventDate,
        eventLocation: ticket.event!.location,
        qrCodeDataUrl,
      }),
      `Send ticket email to ${user.email}`,
      {
        maxRetries: 4, // Extra retry for email (most critical operation)
        initialDelayMs: 1000,
        maxDelayMs: 15000,
        backoffMultiplier: 2,
      }
    );

    console.log("📧 Email send result:", result);

    return result;
  } catch (error) {
    console.error("❌ Error sending ticket email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function sendMultipleTicketsEmailAction(ticketIds: Id<"tickets">[]) {
  console.log(`📧 Starting email send action for ${ticketIds.length} ticket(s)`);
  
  const convex = getConvexClient();

  try {
    // Get all ticket details with retry
    console.log("Fetching ticket details...");
    const ticketPromises = ticketIds.map(ticketId =>
      withRetry(
        () => convex.query(api.tickets.getTicketWithDetails, { ticketId }),
        `Fetch ticket details for ${ticketId}`
      )
    );
    const ticketsData = await Promise.all(ticketPromises);

    console.log("Tickets data:", ticketsData);

    // Validate all tickets exist and belong to same event and user
    if (ticketsData.some(t => !t || !t.event)) {
      console.error("❌ Some tickets or events not found");
      throw new Error("Some tickets or events not found");
    }

    const firstTicket = ticketsData[0];
    const eventId = firstTicket!.eventId;
    const userId = firstTicket!.userId;

    // Verify all tickets are for same event and user
    if (ticketsData.some(t => t!.eventId !== eventId || t!.userId !== userId)) {
      console.error("❌ Tickets belong to different events or users");
      throw new Error("Tickets must belong to same event and user");
    }

    // Get user details with retry
    console.log("Fetching user details for userId:", userId);
    const user = await withRetry(
      () => convex.query(api.users.getUserById, { userId }),
      `Fetch user details for ${userId}`
    );

    console.log("User details:", user);

    if (!user || !user.email) {
      console.error("❌ User email not found");
      throw new Error("User email not found");
    }

    console.log("📧 Generating QR codes for", ticketIds.length, "tickets");

    // Generate QR codes for all tickets with retry
    const QRCode = require("qrcode");
    const ticketsWithQR = await Promise.all(
      ticketsData.map(async (ticket) => {
        const qrCodeDataUrl = await withRetry(
          () => QRCode.toDataURL(
            JSON.stringify({
              ticketId: ticket!._id,
              eventId: ticket!.eventId,
              userId: ticket!.userId,
            }),
            {
              width: 500,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#ffffff",
              },
            }
          ),
          `Generate QR code for ticket ${ticket!._id}`
        ) as string;
        
        return {
          ticketId: ticket!._id,
          qrCodeDataUrl,
        };
      })
    );

    console.log("✅ QR codes generated");
    console.log("📧 Sending email to:", user.email);

    // Send single email with all tickets with retry - CRITICAL with fault tolerance
    const result = await withRetry(
      () => sendMultipleTicketsEmail({
        to: user.email,
        tickets: ticketsWithQR,
        eventName: firstTicket!.event!.name,
        eventDate: firstTicket!.event!.eventDate,
        eventLocation: firstTicket!.event!.location,
      }),
      `Send multiple tickets email to ${user.email}`,
      {
        maxRetries: 4, // Extra retry for email (most critical operation)
        initialDelayMs: 1000,
        maxDelayMs: 15000,
        backoffMultiplier: 2,
      }
    );

    console.log("📧 Email send result:", result);

    return result;
  } catch (error) {
    console.error("❌ Error sending tickets email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}