"use server";

import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sendMultipleTicketsEmailAction } from "./sendTicketEmail";

export async function purchaseTicketAction({
  eventId,
  waitingListId,
  paymentMethod,
  quantity = 1,
}: {
  eventId: Id<"events">;
  waitingListId: Id<"waitingList">;
  paymentMethod: string;
  quantity?: number;
}) {
  console.log("🎫 purchaseTicketAction called with:", {
    eventId,
    waitingListId,
    paymentMethod,
    quantity,
  });

  const { userId } = await auth();
  console.log("👤 User ID from auth:", userId);

  if (!userId) {
    console.error("❌ Not authenticated");
    throw new Error("Not authenticated");
  }

  const convex = getConvexClient();

  try {
    console.log("📞 Calling Convex mutation...");
    
    const result = await convex.mutation(api.events.purchaseTicket, {
      eventId,
      userId,
      waitingListId,
      paymentMethod,
      quantity,
    });

    console.log("✅ Purchase result from Convex:", result);
    console.log("Ticket IDs:", result.ticketIds);

    // Send single email with all tickets after successful purchase
    if (result.success && result.ticketIds && result.ticketIds.length > 0) {
      console.log(`📧 Attempting to send email for ${result.ticketIds.length} ticket(s)`);
      
      try {
        const emailResult = await sendMultipleTicketsEmailAction(result.ticketIds);
        console.log(`📧 Email send result:`, emailResult);
        
        if (emailResult.success) {
          console.log("✅ Tickets email sent successfully");
        } else {
          console.error("❌ Email sending failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("❌ Failed to send tickets email:", emailError);
        // Don't throw error - ticket purchase was successful
      }
    } else {
      console.log("⚠️ No ticketIds in result or success=false, skipping email");
      console.log("Result object:", JSON.stringify(result, null, 2));
    }

    console.log("✅ Returning success to client");
    return { success: true, paymentId: result.paymentId };
  } catch (error) {
    console.error("❌ Purchase failed:", error);
    throw error;
  }
}