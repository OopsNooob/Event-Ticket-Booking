"use server";

import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sendTicketEmailAction } from "./sendTicketEmail";

export async function purchaseTicketAction({
  eventId,
  waitingListId,
  paymentMethod,
}: {
  eventId: Id<"events">;
  waitingListId: Id<"waitingList">;
  paymentMethod: string;
}) {
  console.log("🎫 purchaseTicketAction called with:", {
    eventId,
    waitingListId,
    paymentMethod,
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
    });

    console.log("✅ Purchase result from Convex:", result);
    console.log("Has ticketId?", !!result.ticketId);

    // Send ticket email after successful purchase
    if (result.success && result.ticketId) {
      console.log("📧 Attempting to send email for ticket:", result.ticketId);
      
      try {
        const emailResult = await sendTicketEmailAction(result.ticketId);
        console.log("📧 Email send result:", emailResult);
        
        if (emailResult.success) {
          console.log("✅ Ticket email sent successfully");
        } else {
          console.error("❌ Email sending failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("❌ Failed to send ticket email:", emailError);
        // Don't throw error - ticket purchase was successful
      }
    } else {
      console.log("⚠️ No ticketId in result or success=false, skipping email");
      console.log("Result object:", JSON.stringify(result, null, 2));
    }

    console.log("✅ Returning success to client");
    return { success: true, paymentId: result.paymentId };
  } catch (error) {
    console.error("❌ Purchase failed:", error);
    throw error;
  }
}