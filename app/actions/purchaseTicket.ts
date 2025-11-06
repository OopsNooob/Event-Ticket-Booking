"use server";

import { auth } from "@clerk/nextjs/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function purchaseTicketAction({
  eventId,
  waitingListId,
  paymentMethod,
}: {
  eventId: Id<"events">;
  waitingListId: Id<"waitingList">;
  paymentMethod: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const convex = getConvexClient();

  try {
    const result = await convex.mutation(api.events.purchaseTicket, {
      eventId,
      userId,
      waitingListId,
      paymentMethod,
    });

    return { success: true, paymentId: result.paymentId };
  } catch (error) {
    console.error("Purchase failed:", error);
    throw error;
  }
}