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

  const queuePosition = useQuery(api.waitingList.getQueuePosition, { eventId, userId });
  const userTicket = useQuery(api.tickets.getUserTicketForEvent, { eventId, userId });
  const availability = useQuery(api.events.getEventAvailability, { eventId });
  const event = useQuery(api.events.getById, { eventId });

  // New: query the user's role
  const userRole = useQuery(api.users.getUserRole, { userId });

  // Guard both undefined (loading) and null (not found)
  // include userRole === undefined as part of loading state
  if (
    queuePosition === undefined ||
    availability === undefined ||
    event == null ||
    userRole === undefined
  ) {
    return <Spinner />;
  }

  // After the guard, `event` is narrowed to non-null
  const isEventOwner = userId === event.userId;
  const isPastEvent = event.eventDate < Date.now();

  const hasTicket = !!userTicket;

  const hasActiveOffer =
    queuePosition?.status === WAITING_LIST_STATUS.OFFERED &&
    !!queuePosition.offerExpiresAt &&
    queuePosition.offerExpiresAt > Date.now();

  const isWaiting = queuePosition?.status === WAITING_LIST_STATUS.WAITING;

  const isSoldOut = availability.purchasedCount >= availability.totalTickets;

  const handleJoinQueue = async () => {
    // Prevent organizers, owners, past events, already waiting/has ticket, or active offers
    if (
      userRole === "organizer" ||
      isEventOwner ||
      isPastEvent ||
      isWaiting ||
      hasActiveOffer
    ) {
      // Optionally show a toast for why the action is blocked
      if (userRole === "organizer") {
        toast({
          variant: "destructive",
          title: "Action not allowed",
          description: "Organizers are not allowed to join the waiting list.",
        });
      }
      return;
    }

    try {
      await joinWaitingList({ eventId, userId });

      toast({
        title: "Joined waiting list",
        description: "You have been added to the waiting list.",
      });
    } catch (error) {
      if (error instanceof ConvexError) {
        toast({
          variant: "destructive",
          title: "Cannot join waiting list",
          description: error.message,
        });
      } else {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "Please try again later.",
        });
      }
    }
  };

  // ========================
  // UI STATES (PRIORITY ORDER)
  // ========================

  // If user is organizer — block UI early with message
  if (userRole === "organizer") {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-50 text-red-700 rounded-lg">
        <OctagonXIcon className="w-5 h-5" />
        <span>Organizers are not allowed to buy ticket</span>
      </div>
    );
  }

  if (hasActiveOffer) {
    return <PurchaseTicket eventId={eventId} />;
  }

  if (isWaiting) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-semibold">You're in the waiting list</p>
        <p className="text-yellow-600 text-sm mt-1">Position: #{queuePosition?.position ?? "N/A"}</p>
      </div>
    );
  }

  if (isEventOwner) {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
        <OctagonXIcon className="w-5 h-5" />
        <span>You cannot buy a ticket for your own event</span>
      </div>
    );
  }

  if (isPastEvent) {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
        <Clock className="w-5 h-5" />
        <span>Event has ended</span>
      </div>
    );
  }

  if (isSoldOut) {
    return (
      <div className="text-center p-4">
        <p className="text-lg font-semibold text-red-600">Sorry, this event is sold out</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleJoinQueue}
      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
    >
      Buy Ticket
    </button>
  );
}
