"use client";

import { useUser } from "@clerk/nextjs";
import EventList from "./EventList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import RoleGuard from "@/components/RoleGuard";

export default function SellerEventsPage() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your events</p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRole="organizer">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Events</h1>
            <p className="text-gray-600 mt-2">Manage your events and track sales</p>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Upcoming Events
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Past Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <EventList 
                userId={user.id} 
                filter="upcoming"
                onEventClick={(eventId: Id<"events">) => router.push(`/seller/events/${eventId}`)}
              />
            </TabsContent>

            <TabsContent value="past">
              <EventList 
                userId={user.id} 
                filter="past"
                onEventClick={(eventId: Id<"events">) => router.push(`/seller/events/${eventId}`)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleGuard>
  );
}
