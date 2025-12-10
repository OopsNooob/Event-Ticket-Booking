"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { WAITING_LIST_STATUS } from "@/convex/constants";
import Spinner from "./Spinner";
import PurchaseTicket from "./PurchaseTicket";
import { Clock, OctagonXIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConvexError } from "convex/values";

export default function JoinQueue({
  eventId,
  userId,
}: {
  eventId: Id<"events">;
  userId: string;
}) {
  const { toast } = useToast();
  const joinWaitingList = useMutation(api.events.joinWaitingList);
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });
  const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
    eventId,
    userId,
  });
  const availability = useQuery(api.events.getEventAvailability, { eventId });
  const event = useQuery(api.events.getById, { eventId });

  const isEventOwner = userId === event?.userId;

  const handleJoinQueue = async () => {
    try {
      const result = await joinWaitingList({ eventId, userId });
      if (result.success) {
        console.log("Successfully joined waiting list");
      }
    } catch (error) {
      if (
        error instanceof ConvexError &&
        error.message.includes("joined the waiting list too many times")
      ) {
        toast({
          variant: "destructive",
          title: "Slow down there!",
          description: error.data,
          duration: 5000,
        });
      } else {
        console.error("Error joining waiting list:", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Failed to join queue. Please try again later.",
        });
      }
    }
  };

  if (queuePosition === undefined || availability === undefined || !event) {
    return <Spinner />;
  }

  // Removed the check that blocks users from buying multiple tickets
  // Users can now purchase multiple tickets from the same event
  // if (userTicket) {
  //   return null;
  // }

  const isPastEvent = event.eventDate < Date.now();

  // Check if user has an active offer (not expired)
  const hasActiveOffer = queuePosition?.status === WAITING_LIST_STATUS.OFFERED && 
                         queuePosition.offerExpiresAt && 
                         queuePosition.offerExpiresAt > Date.now();

  // If user has active offer, show purchase form ONLY
  if (hasActiveOffer) {
    return <PurchaseTicket eventId={eventId} />;
  }

  // If user is waiting in queue, show waiting status
  if (queuePosition?.status === WAITING_LIST_STATUS.WAITING) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 font-semibold text-center">
          You're in the waiting list
        </p>
        <p className="text-yellow-600 text-sm text-center mt-1">
          Position: #{queuePosition.position || "N/A"}
        </p>
      </div>
    );
  }

  // Otherwise show buy ticket button (no queue or expired)
  return (
    <div>
      {isEventOwner ? (
        <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
          <OctagonXIcon className="w-5 h-5" />
          <span>You cannot buy a ticket for your own event</span>
        </div>
      ) : isPastEvent ? (
        <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
          <Clock className="w-5 h-5" />
          <span>Event has ended</span>
        </div>
      ) : availability.purchasedCount >= availability?.totalTickets ? (
        <div className="text-center p-4">
          <p className="text-lg font-semibold text-red-600">
            Sorry, this event is sold out
          </p>
        </div>
      ) : (
        <button
          onClick={handleJoinQueue}
          disabled={isPastEvent || isEventOwner}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Buy Ticket
        </button>
      )}
    </div>
  );
}
